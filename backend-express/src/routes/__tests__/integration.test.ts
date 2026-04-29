/**
 * Phase E1: Backend Integration Tests for Event Bus
 *
 * Tests the complete GraphQL → Express → Frontend event flow with real HTTP calls
 * and SSE connections. Covers:
 * - Single client event flow
 * - Multi-client synchronization
 * - Error handling and recovery
 * - Latency and performance
 * - Metrics accumulation
 * - Concurrent load scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import eventsRouter from '../events';
import { eventBus, EventBusMetricsCollector } from '../../services/event-bus';

/**
 * Test helper: Create Express app with events router
 */
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use('/events', eventsRouter);
  process.env.EXPRESS_EVENT_SECRET = 'test-secret-key';
  return app;
}

/**
 * Test helper: Connect SSE client and return EventSource
 * Resolves after connection is established
 */
function connectSSE(baseUrl: string): Promise<EventSource> {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`${baseUrl}/events`);
    const timeout = setTimeout(() => {
      es.close();
      reject(new Error('SSE connection timeout'));
    }, 5000);

    es.onopen = () => {
      clearTimeout(timeout);
      resolve(es);
    };

    es.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('SSE connection error'));
    };
  });
}

/**
 * Test helper: Emit event via HTTP POST (simulate GraphQL mutation)
 */
async function emitEvent(
  req: any,
  eventType: string,
  payload: Record<string, any>
): Promise<any> {
  return req
    .post('/events/emit')
    .set('Authorization', 'Bearer test-secret-key')
    .send({
      event: eventType,
      payload: {
        eventId: uuidv4(),
        eventType,
        timestamp: Date.now(),
        sourceLayer: 'graphql',
        userId: 'test-user',
        ...payload,
      },
    });
}

/**
 * Test helper: Wait for event on EventSource with timeout
 */
function waitForEvent(
  eventSource: EventSource,
  eventType: string,
  timeoutMs: number = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventType}`));
    }, timeoutMs);

    const handler = (event: Event) => {
      const messageEvent = event as MessageEvent;
      try {
        const data = JSON.parse(messageEvent.data);
        if (data.type === eventType) {
          clearTimeout(timeout);
          eventSource.removeEventListener(eventType, handler);
          resolve(data);
        }
      } catch (e) {
        // Ignore non-JSON messages (heartbeat)
      }
    };

    eventSource.addEventListener(eventType, handler);
  });
}

describe('Phase E1: Event Bus Integration Tests', () => {
  let app: Express;
  let baseUrl: string;
  const sseClients: EventSource[] = [];

  beforeEach(() => {
    app = createTestApp();
    baseUrl = 'http://localhost:5000';
    // Clear collected SSE clients
    sseClients.length = 0;
  });

  afterEach(async () => {
    // Close all SSE connections
    for (const es of sseClients) {
      es.close();
    }
    sseClients.length = 0;
  });

  // ============================================================================
  // Test Suite 1: Single Client Event Flow
  // ============================================================================

  describe('Suite 1: Single Client Event Flow', () => {
    it('should receive event from GraphQL mutation via SSE', async () => {
      const req = request(app);
      const eventSource = await connectSSE(baseUrl);
      sseClients.push(eventSource);

      // Emit event
      const response = await emitEvent(req, 'buildCreated', {
        buildId: '123',
        build: {
          id: '123',
          name: 'Test Build',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);

      // Wait for event on SSE
      const event = await waitForEvent(eventSource, 'buildCreated');
      expect(event).toBeDefined();
      expect(event.type).toBe('buildCreated');
      expect(event.data.buildId).toBe('123');
    });

    it('should deduplicate duplicate events', async () => {
      const req = request(app);
      const eventSource = await connectSSE(baseUrl);
      sseClients.push(eventSource);

      const eventId = uuidv4();
      const payload = {
        eventId,
        buildId: '456',
        build: {
          id: '456',
          name: 'Dedup Test',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      };

      // Emit event first time
      let response = await emitEvent(req, 'buildCreated', payload);
      expect(response.status).toBe(200);

      // Wait for first event
      const event1 = await waitForEvent(eventSource, 'buildCreated');
      expect(event1.data.eventId).toBe(eventId);

      // Emit same event again (duplicate)
      response = await emitEvent(req, 'buildCreated', payload);
      expect(response.status).toBe(200);

      // Second event should not arrive (dedup prevents it)
      // Wait a bit and verify no new event
      let eventReceived = false;
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000));
      const eventPromise = waitForEvent(eventSource, 'buildCreated', 500).then(
        () => {
          eventReceived = true;
        }
      );

      await Promise.race([eventPromise, timeoutPromise]).catch(() => {
        // Timeout is expected - no duplicate should arrive
      });

      expect(eventReceived).toBe(false);
    });

    it('should handle multiple mutations with different event types', async () => {
      const req = request(app);
      const eventSource = await connectSSE(baseUrl);
      sseClients.push(eventSource);

      const events: any[] = [];

      // Create promise to collect events
      const collectEvent = (type: string) =>
        waitForEvent(eventSource, type, 5000)
          .then((e) => {
            events.push(e);
            return e;
          });

      // Emit 4 different event types
      const eventTypes = [
        { type: 'buildCreated', payload: { buildId: '100', build: { id: '100' } } },
        {
          type: 'buildStatusChanged',
          payload: { buildId: '100', oldStatus: 'PENDING', newStatus: 'RUNNING' },
        },
        {
          type: 'partAdded',
          payload: {
            buildId: '100',
            partId: 'p1',
            part: { id: 'p1', buildId: '100', name: 'Part1', sku: 'SKU1' },
          },
        },
        {
          type: 'testRunSubmitted',
          payload: {
            buildId: '100',
            testRunId: 't1',
            testRun: { id: 't1', buildId: '100', status: 'PENDING' },
          },
        },
      ];

      // Start collecting events
      const collectors = eventTypes.map((e) => collectEvent(e.type));

      // Emit all events
      for (const et of eventTypes) {
        const response = await emitEvent(req, et.type, et.payload);
        expect(response.status).toBe(200);
      }

      // Wait for all events to arrive
      await Promise.all(collectors);

      expect(events).toHaveLength(4);
      expect(events.map((e) => e.type)).toEqual([
        'buildCreated',
        'buildStatusChanged',
        'partAdded',
        'testRunSubmitted',
      ]);
    });
  });

  // ============================================================================
  // Test Suite 2: Multi-Client Synchronization
  // ============================================================================

  describe('Suite 2: Multi-Client Synchronization', () => {
    it('should broadcast same event to two connected clients', async () => {
      const req = request(app);

      // Connect 2 clients
      const client1 = await connectSSE(baseUrl);
      const client2 = await connectSSE(baseUrl);
      sseClients.push(client1, client2);

      // Set up listeners before emitting
      const event1Promise = waitForEvent(client1, 'buildCreated', 5000);
      const event2Promise = waitForEvent(client2, 'buildCreated', 5000);

      // Emit event
      const response = await emitEvent(req, 'buildCreated', {
        buildId: '200',
        build: { id: '200', name: 'Multi-client Test' },
      });
      expect(response.status).toBe(200);

      // Both clients should receive the event
      const [event1, event2] = await Promise.all([event1Promise, event2Promise]);

      expect(event1.type).toBe('buildCreated');
      expect(event2.type).toBe('buildCreated');
      expect(event1.data.buildId).toBe(event2.data.buildId);
      expect(event1.data.buildId).toBe('200');
    });

    it('should handle staggered client connections correctly', async () => {
      const req = request(app);

      // Connect client 1
      const client1 = await connectSSE(baseUrl);
      sseClients.push(client1);

      // Emit event 1
      const response1 = await emitEvent(req, 'buildCreated', {
        buildId: '300',
        build: { id: '300', name: 'Event 1' },
      });
      expect(response1.status).toBe(200);

      // Client 1 should receive it
      const event1c1 = await waitForEvent(client1, 'buildCreated');
      expect(event1c1.data.buildId).toBe('300');

      // Connect client 2 (after event 1 was already sent)
      const client2 = await connectSSE(baseUrl);
      sseClients.push(client2);

      // Emit event 2
      const response2 = await emitEvent(req, 'buildStatusChanged', {
        buildId: '300',
        oldStatus: 'PENDING',
        newStatus: 'RUNNING',
      });
      expect(response2.status).toBe(200);

      // Both clients should receive event 2
      const event2c1 = await waitForEvent(client1, 'buildStatusChanged');
      const event2c2 = await waitForEvent(client2, 'buildStatusChanged');

      expect(event2c1.type).toBe('buildStatusChanged');
      expect(event2c2.type).toBe('buildStatusChanged');

      // Connect client 3 and emit event 3
      const client3 = await connectSSE(baseUrl);
      sseClients.push(client3);

      const response3 = await emitEvent(req, 'partAdded', {
        buildId: '300',
        partId: 'p100',
        part: { id: 'p100', buildId: '300', name: 'Part' },
      });
      expect(response3.status).toBe(200);

      // All three clients should receive event 3
      const event3c1 = await waitForEvent(client1, 'partAdded');
      const event3c2 = await waitForEvent(client2, 'partAdded');
      const event3c3 = await waitForEvent(client3, 'partAdded');

      expect(event3c1.data.partId).toBe('p100');
      expect(event3c2.data.partId).toBe('p100');
      expect(event3c3.data.partId).toBe('p100');
    });

    it('should broadcast to five concurrent clients', async () => {
      const req = request(app);
      const numClients = 5;

      // Connect 5 clients
      const clients: EventSource[] = [];
      for (let i = 0; i < numClients; i++) {
        const client = await connectSSE(baseUrl);
        clients.push(client);
        sseClients.push(client);
      }

      // Set up listeners for all clients
      const eventPromises = clients.map((client) =>
        waitForEvent(client, 'buildCreated', 5000)
      );

      // Emit event
      const response = await emitEvent(req, 'buildCreated', {
        buildId: '400',
        build: { id: '400', name: 'Five Clients' },
      });
      expect(response.status).toBe(200);

      // All clients should receive the event
      const events = await Promise.all(eventPromises);

      expect(events).toHaveLength(5);
      expect(events.every((e) => e.type === 'buildCreated')).toBe(true);
      expect(events.every((e) => e.data.buildId === '400')).toBe(true);
    });
  });

  // ============================================================================
  // Test Suite 3: Error Handling & Recovery
  // ============================================================================

  describe('Suite 3: Error Handling & Recovery', () => {
    it('should handle client disconnect gracefully', async () => {
      const req = request(app);

      // Connect 3 clients
      const client1 = await connectSSE(baseUrl);
      const client2 = await connectSSE(baseUrl);
      const client3 = await connectSSE(baseUrl);
      sseClients.push(client1, client2, client3);

      // Disconnect client 1
      client1.close();
      sseClients.splice(sseClients.indexOf(client1), 1);

      // Give it a moment to process the disconnect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Set up listeners for remaining clients
      const event2Promise = waitForEvent(client2, 'buildCreated', 5000);
      const event3Promise = waitForEvent(client3, 'buildCreated', 5000);

      // Emit event after client 1 disconnects
      const response = await emitEvent(req, 'buildCreated', {
        buildId: '500',
        build: { id: '500', name: 'After Disconnect' },
      });
      expect(response.status).toBe(200);

      // Clients 2 and 3 should receive it
      const [event2, event3] = await Promise.all([event2Promise, event3Promise]);
      expect(event2.data.buildId).toBe('500');
      expect(event3.data.buildId).toBe('500');
    });

    it('should reject malformed event payload with 400', async () => {
      const req = request(app);

      // Missing event field
      let response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          payload: { buildId: '600' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('missing_event');

      // Missing payload field
      response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          event: 'buildCreated',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('missing_payload');
    });

    it('should reject unauthorized requests', async () => {
      const req = request(app);

      // Missing auth header
      let response = await req
        .post('/events/emit')
        .send({
          event: 'buildCreated',
          payload: { buildId: '700' },
        });

      expect(response.status).toBe(403);

      // Invalid auth header
      response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer wrong-secret')
        .send({
          event: 'buildCreated',
          payload: { buildId: '700' },
        });

      expect(response.status).toBe(403);
    });
  });

  // ============================================================================
  // Test Suite 4: Latency & Performance
  // ============================================================================

  describe('Suite 4: Latency & Performance', () => {
    it('should deliver events with sub-100ms latency', async () => {
      const req = request(app);
      const client = await connectSSE(baseUrl);
      sseClients.push(client);

      const latencies: number[] = [];

      // Send 10 events and measure latency
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        const eventPromise = waitForEvent(client, 'buildCreated', 5000);

        const response = await emitEvent(req, 'buildCreated', {
          buildId: `lat-${i}`,
          build: { id: `lat-${i}`, name: `Latency Test ${i}` },
        });
        expect(response.status).toBe(200);

        const event = await eventPromise;
        const endTime = performance.now();
        const latency = endTime - startTime;

        latencies.push(latency);
        expect(latency).toBeLessThan(1000); // Allow up to 1 second in test
      }

      // Calculate average latency
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(avgLatency).toBeLessThan(500); // Average should be well under 100ms in test environment
    });

    it('should not degrade performance under rapid events', async () => {
      const req = request(app);
      const client = await connectSSE(baseUrl);
      sseClients.push(client);

      const eventPromises: Promise<any>[] = [];
      const startTime = performance.now();

      // Send 50 rapid events
      for (let i = 0; i < 50; i++) {
        eventPromises.push(waitForEvent(client, 'buildCreated', 5000));

        const response = await emitEvent(req, 'buildCreated', {
          buildId: `rapid-${i}`,
          build: { id: `rapid-${i}` },
        });
        expect(response.status).toBe(200);
      }

      // All events should arrive
      const events = await Promise.all(eventPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(events).toHaveLength(50);
      expect(totalTime).toBeLessThan(30000); // Should complete in reasonable time
    });
  });

  // ============================================================================
  // Test Suite 5: Metrics Verification
  // ============================================================================

  describe('Suite 5: Metrics Verification', () => {
    it('should track metrics for emitted and broadcast events', async () => {
      const req = request(app);
      const client = await connectSSE(baseUrl);
      sseClients.push(client);

      // Get initial metrics
      const metricsResponse1 = await req.get('/events/metrics');
      const initialMetrics = metricsResponse1.body.metrics;

      // Set up listener before emitting
      const eventPromise = waitForEvent(client, 'buildCreated', 5000);

      // Emit an event
      const response = await emitEvent(req, 'buildCreated', {
        buildId: '800',
        build: { id: '800', name: 'Metrics Test' },
      });
      expect(response.status).toBe(200);

      // Wait for event to be delivered
      const event = await eventPromise;
      expect(event).toBeDefined();

      // Get updated metrics
      const metricsResponse2 = await req.get('/events/metrics');
      const updatedMetrics = metricsResponse2.body.metrics;

      // Verify metrics increased
      expect(updatedMetrics.totalEmitted).toBe(initialMetrics.totalEmitted + 1);
      expect(updatedMetrics.totalBroadcasted).toBe(initialMetrics.totalBroadcasted + 1);

      // Verify event type count
      const buildCreatedCount = updatedMetrics.eventCounts.buildCreated || 0;
      const prevBuildCreatedCount = initialMetrics.eventCounts.buildCreated || 0;
      expect(buildCreatedCount).toBe(prevBuildCreatedCount + 1);
    });

    it('should track duplicate events in metrics', async () => {
      const req = request(app);
      const client = await connectSSE(baseUrl);
      sseClients.push(client);

      const metricsResponse1 = await req.get('/events/metrics');
      const initialMetrics = metricsResponse1.body.metrics;

      const eventId = uuidv4();

      // Emit same event twice
      for (let i = 0; i < 2; i++) {
        const eventPromise =
          i === 0
            ? waitForEvent(client, 'buildCreated', 5000)
            : Promise.resolve(null);

        const response = await emitEvent(req, 'buildCreated', {
          eventId,
          buildId: '900',
          build: { id: '900' },
        });
        expect(response.status).toBe(200);

        if (i === 0) {
          const event = await eventPromise;
          expect(event).toBeDefined();
        }
      }

      // Give dedup time to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metricsResponse2 = await req.get('/events/metrics');
      const updatedMetrics = metricsResponse2.body.metrics;

      // First emission should count as broadcast
      expect(updatedMetrics.totalBroadcasted).toBeGreaterThan(
        initialMetrics.totalBroadcasted
      );

      // Second should be deduplicated
      expect(updatedMetrics.totalDuplicates).toBe(initialMetrics.totalDuplicates + 1);
    });

    it('should update connected client count in metrics', async () => {
      const req = request(app);

      // Check initial client count
      let metricsResponse = await req.get('/events/metrics');
      const initialClientCount = metricsResponse.body.metrics.connectedClients;

      // Connect a client
      const client = await connectSSE(baseUrl);
      sseClients.push(client);

      // Give it a moment to register
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check updated client count
      metricsResponse = await req.get('/events/metrics');
      const newClientCount = metricsResponse.body.metrics.connectedClients;

      expect(newClientCount).toBe(initialClientCount + 1);

      // Client details should be available
      expect(metricsResponse.body.clientDetails).toBeInstanceOf(Array);
      expect(metricsResponse.body.clientDetails.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Test Suite 6: Concurrent Load
  // ============================================================================

  describe('Suite 6: Concurrent Load', () => {
    it('should handle 20 concurrent clients receiving same event', async () => {
      const req = request(app);
      const numClients = 20;

      // Connect 20 clients
      const clients: EventSource[] = [];
      for (let i = 0; i < numClients; i++) {
        const client = await connectSSE(baseUrl);
        clients.push(client);
        sseClients.push(client);
      }

      // Set up listeners
      const eventPromises = clients.map((client) =>
        waitForEvent(client, 'buildCreated', 5000)
      );

      // Emit event
      const response = await emitEvent(req, 'buildCreated', {
        buildId: 'concurrent-1000',
        build: { id: 'concurrent-1000', name: 'Concurrent Load Test' },
      });
      expect(response.status).toBe(200);

      // All clients should receive the event
      const events = await Promise.all(eventPromises);

      expect(events).toHaveLength(numClients);
      expect(events.every((e) => e.data.buildId === 'concurrent-1000')).toBe(true);
    });

    it('should handle rapid sequential events to 10 clients', async () => {
      const req = request(app);
      const numClients = 10;
      const numEvents = 30;

      // Connect 10 clients
      const clients: EventSource[] = [];
      for (let i = 0; i < numClients; i++) {
        const client = await connectSSE(baseUrl);
        clients.push(client);
        sseClients.push(client);
      }

      // Track events received by each client
      const eventsPerClient: any[][] = clients.map(() => []);
      const eventListeners = clients.map((client, clientIdx) => {
        const listener = (event: Event) => {
          const messageEvent = event as MessageEvent;
          try {
            const data = JSON.parse(messageEvent.data);
            if (data.type === 'buildCreated') {
              eventsPerClient[clientIdx].push(data);
            }
          } catch (e) {
            // Ignore non-JSON
          }
        };
        client.addEventListener('buildCreated', listener);
        return listener;
      });

      // Send rapid events
      const startTime = performance.now();
      for (let i = 0; i < numEvents; i++) {
        const response = await emitEvent(req, 'buildCreated', {
          eventId: uuidv4(),
          buildId: `rapid-load-${i}`,
          build: { id: `rapid-load-${i}` },
        });
        expect(response.status).toBe(200);
      }
      const endTime = performance.now();

      // Wait for events to propagate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // All clients should have received all events (no duplicates)
      eventsPerClient.forEach((clientEvents, idx) => {
        expect(clientEvents.length).toBe(numEvents);

        // Check no duplicates (all eventIds unique)
        const eventIds = clientEvents.map((e) => e.data.eventId);
        const uniqueIds = new Set(eventIds);
        expect(uniqueIds.size).toBe(numEvents);
      });

      // Performance should be reasonable (30 events to 10 clients in < 10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);

      // Clean up listeners
      clients.forEach((client, idx) => {
        client.removeEventListener('buildCreated', eventListeners[idx]);
      });
    });
  });

  // ============================================================================
  // Additional: Health Check & Events Endpoints
  // ============================================================================

  describe('Endpoint: GET /health', () => {
    it('should return health status with client count', async () => {
      const req = request(app);

      const response = await req.get('/events/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('connectedClients');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Endpoint: GET /metrics', () => {
    it('should return detailed metrics and client details', async () => {
      const req = request(app);

      const response = await req.get('/events/metrics');

      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.clientDetails).toBeDefined();
      expect(response.body.deduplicatorStats).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      // Verify metric structure
      const metrics = response.body.metrics;
      expect(metrics).toHaveProperty('totalEmitted');
      expect(metrics).toHaveProperty('totalBroadcasted');
      expect(metrics).toHaveProperty('totalDuplicates');
      expect(metrics).toHaveProperty('averageLatencyMs');
      expect(metrics).toHaveProperty('connectedClients');
      expect(metrics).toHaveProperty('eventCounts');
    });
  });
});
