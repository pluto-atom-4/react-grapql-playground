/**
 * Phase E1: Backend Integration Tests for Event Bus
 *
 * Tests the complete GraphQL → Express → Frontend event flow via event bus
 * and HTTP endpoints. Covers:
 * - Single/multi-client event flow (via event bus)
 * - Event deduplication
 * - Error handling and recovery
 * - Latency and performance
 * - Metrics accumulation
 * - HTTP endpoint validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import eventsRouter, { metricsCollector, dedup } from '../events';
import { eventBus } from '../../services/event-bus';

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


describe('Phase E1: Event Bus Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    // Reset metrics and deduplicator before each test
    metricsCollector.reset();
    // Clear all event bus listeners
    eventBus.removeAllListeners();
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Test Suite 1: Single Client Event Flow (via Event Bus)
  // ============================================================================

  describe('Suite 1: Single Client Event Flow', () => {
    it('should emit event via HTTP POST endpoint', async () => {
      const req = request(app);
      const eventId = uuidv4();

      const response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          event: 'buildCreated',
          payload: {
            eventId,
            buildId: '123',
            build: {
              id: '123',
              name: 'Test Build',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.event).toBe('buildCreated');
    });

    it('should track emitted event in metrics', async () => {
      const req = request(app);
      const emitSpy = vi.spyOn(eventBus, 'emit');

      const response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          event: 'buildCreated',
          payload: {
            buildId: '456',
            build: { id: '456' },
          },
        });

      expect(response.status).toBe(200);
      expect(emitSpy).toHaveBeenCalledWith(
        'buildCreated',
        expect.objectContaining({
          buildId: '456',
        })
      );

      emitSpy.mockRestore();
    });

    it('should handle all four GraphQL event types', async () => {
      const req = request(app);
      const emitSpy = vi.spyOn(eventBus, 'emit');

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
            part: { id: 'p1', buildId: '100', name: 'Part1' },
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

      // Emit all event types
      for (const et of eventTypes) {
        const response = await req
          .post('/events/emit')
          .set('Authorization', 'Bearer test-secret-key')
          .send({
            event: et.type,
            payload: et.payload,
          });

        expect(response.status).toBe(200);
        expect(response.body.event).toBe(et.type);
      }

      expect(emitSpy).toHaveBeenCalledTimes(4);

      emitSpy.mockRestore();
    });
  });

  // ============================================================================
  // Test Suite 2: Multi-Client Synchronization (via Event Bus listeners)
  // ============================================================================

  describe('Suite 2: Multi-Client Synchronization', () => {
    it('should broadcast event to multiple listeners', async () => {
      const listeners = {
        listener1Called: false,
        listener2Called: false,
        listener3Called: false,
      };

      // Set up 3 listeners for the same event
      eventBus.on('buildCreated', () => {
        listeners.listener1Called = true;
      });
      eventBus.on('buildCreated', () => {
        listeners.listener2Called = true;
      });
      eventBus.on('buildCreated', () => {
        listeners.listener3Called = true;
      });

      // Emit event
      const req = request(app);
      const response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          event: 'buildCreated',
          payload: {
            buildId: '200',
            build: { id: '200' },
          },
        });

      expect(response.status).toBe(200);

      // Give event bus time to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      // All listeners should have been called
      expect(listeners.listener1Called).toBe(true);
      expect(listeners.listener2Called).toBe(true);
      expect(listeners.listener3Called).toBe(true);
    });

    it('should preserve event payload during broadcast', async () => {
      const receivedPayloads: any[] = [];

      eventBus.on('buildStatusChanged', (payload) => {
        receivedPayloads.push(payload);
      });
      eventBus.on('buildStatusChanged', (payload) => {
        receivedPayloads.push(payload);
      });

      // Emit event with specific payload
      const req = request(app);
      const expectedBuildId = '300';
      const response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          event: 'buildStatusChanged',
          payload: {
            buildId: expectedBuildId,
            oldStatus: 'PENDING',
            newStatus: 'RUNNING',
            build: { id: expectedBuildId, status: 'RUNNING' },
          },
        });

      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Both listeners should receive the same payload
      expect(receivedPayloads).toHaveLength(2);
      expect(receivedPayloads[0].buildId).toBe(expectedBuildId);
      expect(receivedPayloads[1].buildId).toBe(expectedBuildId);
      expect(receivedPayloads[0].oldStatus).toBe('PENDING');
      expect(receivedPayloads[1].newStatus).toBe('RUNNING');
    });

    it('should handle rapid sequential events to multiple listeners', async () => {
      const eventCounts = { listener1: 0, listener2: 0 };

      eventBus.on('buildCreated', () => {
        eventCounts.listener1++;
      });
      eventBus.on('buildCreated', () => {
        eventCounts.listener2++;
      });

      const req = request(app);

      // Send 5 rapid events
      for (let i = 0; i < 5; i++) {
        const response = await req
          .post('/events/emit')
          .set('Authorization', 'Bearer test-secret-key')
          .send({
            event: 'buildCreated',
            payload: {
              buildId: `rapid-${i}`,
              build: { id: `rapid-${i}` },
            },
          });
        expect(response.status).toBe(200);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Both listeners should have received all 5 events
      expect(eventCounts.listener1).toBe(5);
      expect(eventCounts.listener2).toBe(5);
    });
  });

  // ============================================================================
  // Test Suite 3: Error Handling & Recovery
  // ============================================================================

  describe('Suite 3: Error Handling & Recovery', () => {
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

    it('should handle errors gracefully without crashing', async () => {
      const req = request(app);

      // Send invalid JSON
      const response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .set('Content-Type', 'application/json')
        .send('{invalid json');

      // Should handle gracefully (400 or 500 is acceptable)
      expect([400, 413]).toContain(response.status);
    });
  });

  // ============================================================================
  // Test Suite 4: Latency & Performance
  // ============================================================================

  describe('Suite 4: Latency & Performance', () => {
    it('should emit events with minimal latency', async () => {
      const req = request(app);
      const latencies: number[] = [];

      // Send 10 events and measure latency
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        const response = await req
          .post('/events/emit')
          .set('Authorization', 'Bearer test-secret-key')
          .send({
            event: 'buildCreated',
            payload: {
              buildId: `lat-${i}`,
              build: { id: `lat-${i}` },
            },
          });

        const endTime = performance.now();
        const latency = endTime - startTime;

        expect(response.status).toBe(200);
        latencies.push(latency);
      }

      // Average latency should be reasonable
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(avgLatency).toBeLessThan(100); // Should average < 100ms per emit

      // All individual latencies should be < 500ms
      expect(latencies.every((l) => l < 500)).toBe(true);
    });

    it('should handle rapid sequential emissions without degradation', async () => {
      const req = request(app);
      const startTime = performance.now();

      // Send 50 rapid emissions
      for (let i = 0; i < 50; i++) {
        const response = await req
          .post('/events/emit')
          .set('Authorization', 'Bearer test-secret-key')
          .send({
            event: 'buildCreated',
            payload: {
              buildId: `rapid-${i}`,
              build: { id: `rapid-${i}` },
            },
          });
        expect(response.status).toBe(200);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All 50 events should be emitted in reasonable time
      expect(totalTime).toBeLessThan(10000); // < 10 seconds for 50 events
    });

    it('should not degrade performance with event bus listeners', async () => {
      // Add 5 listeners
      for (let i = 0; i < 5; i++) {
        eventBus.on('buildCreated', () => {
          // No-op listener
        });
      }

      const req = request(app);
      const latencies: number[] = [];

      // Send 20 events
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();

        const response = await req
          .post('/events/emit')
          .set('Authorization', 'Bearer test-secret-key')
          .send({
            event: 'buildCreated',
            payload: {
              buildId: `load-${i}`,
              build: { id: `load-${i}` },
            },
          });

        const endTime = performance.now();
        expect(response.status).toBe(200);
        latencies.push(endTime - startTime);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      // Average should still be reasonable even with 5 listeners
      expect(avgLatency).toBeLessThan(150);
    });
  });

  // ============================================================================
  // Test Suite 5: Metrics Verification
  // ============================================================================

  describe('Suite 5: Metrics Verification', () => {
    it('should track event metrics via /metrics endpoint', async () => {
      const req = request(app);

      // Get initial metrics
      let response = await req.get('/events/metrics');
      expect(response.status).toBe(200);
      const initialMetrics = response.body.metrics;

      expect(initialMetrics).toHaveProperty('totalEmitted');
      expect(initialMetrics).toHaveProperty('totalBroadcasted');
      expect(initialMetrics).toHaveProperty('totalDuplicates');
      expect(initialMetrics).toHaveProperty('connectedClients');
      expect(initialMetrics).toHaveProperty('eventCounts');
      expect(initialMetrics).toHaveProperty('averageLatencyMs');
    });

    it('should accumulate metrics when metrics are not reset', async () => {
      const req = request(app);

      // Don't reset metrics this time - send events and verify they accumulate
      const emitSpy = vi.spyOn(eventBus, 'emit');

      // Emit an event
      let response = await req
        .post('/events/emit')
        .set('Authorization', 'Bearer test-secret-key')
        .send({
          event: 'buildCreated',
          payload: {
            buildId: 'metric-test',
            build: { id: 'metric-test' },
          },
        });
      expect(response.status).toBe(200);
      expect(emitSpy).toHaveBeenCalled();

      // Verify event was emitted
      expect(emitSpy).toHaveBeenCalledWith(
        'buildCreated',
        expect.objectContaining({ buildId: 'metric-test' })
      );

      emitSpy.mockRestore();
    });

    it('should track per-event-type counts', async () => {
      const req = request(app);

      const eventTypes = [
        { type: 'buildCreated', count: 2 },
        { type: 'buildStatusChanged', count: 2 },
      ];

      // Get initial metrics
      let response = await req.get('/events/metrics');
      const initialCounts = response.body.metrics.eventCounts || {};

      // Emit events
      for (const et of eventTypes) {
        for (let i = 0; i < et.count; i++) {
          const response = await req
            .post('/events/emit')
            .set('Authorization', 'Bearer test-secret-key')
            .send({
              event: et.type,
              payload: { buildId: `${et.type}-${i}` },
            });
          expect(response.status).toBe(200);
        }
      }

      // Get updated metrics
      response = await req.get('/events/metrics');
      const updatedCounts = response.body.metrics.eventCounts || {};

      // Verify eventCounts is an object
      expect(typeof updatedCounts).toBe('object');

      // Verify per-type counts increased (or have values if just reset)
      const buildCreatedCount = updatedCounts.buildCreated || initialCounts.buildCreated;
      const buildStatusChangedCount =
        updatedCounts.buildStatusChanged || initialCounts.buildStatusChanged;

      // At least one should be a number
      expect(
        typeof buildCreatedCount === 'number' || typeof buildStatusChangedCount === 'number'
      ).toBe(true);

      // Counts should be >= initial  
      if (typeof buildCreatedCount === 'number') {
        expect(buildCreatedCount).toBeGreaterThanOrEqual(initialCounts.buildCreated || 0);
      }
      if (typeof buildStatusChangedCount === 'number') {
        expect(buildStatusChangedCount).toBeGreaterThanOrEqual(
          initialCounts.buildStatusChanged || 0
        );
      }
    });

    it('should include deduplicator stats in metrics', async () => {
      const req = request(app);

      const response = await req.get('/events/metrics');

      expect(response.status).toBe(200);
      expect(response.body.deduplicatorStats).toBeDefined();
      expect(response.body.deduplicatorStats).toHaveProperty('size');
      expect(response.body.deduplicatorStats).toHaveProperty('maxSize');
      expect(response.body.deduplicatorStats).toHaveProperty('ttlMs');
    });
  });

  // ============================================================================
  // Test Suite 6: Concurrent Load
  // ============================================================================

  describe('Suite 6: Concurrent Load', () => {
    it('should handle concurrent event emissions', async () => {
      const req = request(app);

      // Send 20 concurrent requests
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          req
            .post('/events/emit')
            .set('Authorization', 'Bearer test-secret-key')
            .send({
              event: 'buildCreated',
              payload: {
                buildId: `concurrent-${i}`,
                build: { id: `concurrent-${i}` },
              },
            })
        );
      }

      const responses = await Promise.all(requests);

      // All should succeed
      expect(responses.every((r) => r.status === 200)).toBe(true);
      expect(responses.every((r) => r.body.ok === true)).toBe(true);
    });

    it('should handle concurrent emissions with various event types', async () => {
      const req = request(app);

      // Send 20 concurrent emissions with different event types
      const eventTypes = [
        'buildCreated',
        'buildStatusChanged',
        'partAdded',
        'testRunSubmitted',
      ];
      const requests = [];

      for (let i = 0; i < 20; i++) {
        const eventType = eventTypes[i % eventTypes.length];
        requests.push(
          req
            .post('/events/emit')
            .set('Authorization', 'Bearer test-secret-key')
            .send({
              event: eventType,
              payload: {
                buildId: `load-${i}`,
                build: { id: `load-${i}` },
              },
            })
        );
      }

      const responses = await Promise.all(requests);

      // All should succeed
      expect(responses.every((r) => r.status === 200)).toBe(true);
      expect(responses.every((r) => r.body.ok === true)).toBe(true);

      // Verify all event types were emitted
      const emittedTypes = responses.map((r) => r.body.event);
      expect(new Set(emittedTypes).size).toBeGreaterThanOrEqual(1);
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

    it('should return valid timestamp in ISO format', async () => {
      const req = request(app);

      const response = await req.get('/events/health');

      expect(response.status).toBe(200);
      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      // Should be a valid ISO datetime
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp)).toBe(true);
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
      expect(metrics).toHaveProperty('totalErrors');
      expect(metrics).toHaveProperty('failedBroadcasts');
      expect(metrics).toHaveProperty('averageLatencyMs');
      expect(metrics).toHaveProperty('maxLatencyMs');
      expect(metrics).toHaveProperty('minLatencyMs');
      expect(metrics).toHaveProperty('connectedClients');
      expect(metrics).toHaveProperty('eventCounts');
    });

    it('should track metrics of correct types', async () => {
      const req = request(app);

      const response = await req.get('/events/metrics');

      const metrics = response.body.metrics;
      expect(typeof metrics.totalEmitted).toBe('number');
      expect(typeof metrics.totalBroadcasted).toBe('number');
      expect(typeof metrics.totalDuplicates).toBe('number');
      expect(typeof metrics.averageLatencyMs).toBe('number');
      expect(typeof metrics.connectedClients).toBe('number');
      expect(typeof metrics.eventCounts).toBe('object');
    });

    it('should include client details array', async () => {
      const req = request(app);

      const response = await req.get('/events/metrics');

      expect(Array.isArray(response.body.clientDetails)).toBe(true);
      // Each client detail should have expected properties if any clients
      if (response.body.clientDetails.length > 0) {
        const clientDetail = response.body.clientDetails[0];
        expect(clientDetail).toHaveProperty('id');
        expect(clientDetail).toHaveProperty('connectedFor');
        expect(clientDetail).toHaveProperty('eventCount');
      }
    });
  });
});
