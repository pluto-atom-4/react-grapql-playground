/**
 * Server-Sent Events (SSE) Route
 *
 * GET /events - Establishes SSE connection for real-time events
 * GET /health - Check SSE health and connected client count
 * GET /metrics - View event bus metrics and client details
 * POST /emit - Receive events from GraphQL backend (with authentication)
 *
 * Features:
 * - Heartbeat mechanism: sends pings every 30 seconds to detect stale connections
 * - Timeout detection: closes connections idle for 2+ minutes
 * - Deduplication: prevents duplicate events from being broadcast
 * - Metrics tracking: monitors throughput, latency, errors
 * - Graceful cleanup: handles client disconnects and errors
 *
 * Clients connect and receive streamed events:
 * - fileUploaded
 * - ciResults
 * - sensorData
 * - buildCreated, buildStatusChanged, partAdded, testRunSubmitted (from GraphQL)
 *
 * Keeps connection open and broadcasts events to all connected clients.
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import express from 'express';
import type { BufferEncoding } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { eventBus, EventBusMetricsCollector } from '../services/event-bus';
import { EventDeduplicator } from '../services/event-deduplicator';
import { asyncHandler } from '../middleware/error';
import { validateEventSecret } from '../middleware/validateEventSecret';

const router: ExpressRouter = Router();

// Deduplicator instance (shared across all SSE connections)
const dedup = new EventDeduplicator({
  maxSize: parseInt(process.env.EVENT_DEDUP_MAX_SIZE || '1000'),
  ttlMs: parseInt(process.env.EVENT_DEDUP_TTL_MS || '300000'),
});

// Metrics collector (shared across all connections)
const metricsCollector = new EventBusMetricsCollector();

// Type for client tracking with metadata
interface SSEClient {
  id: string;
  res: Response;
  createdAt: number;
  eventCount: number;
}

// Type for event payload with optional eventId
interface EventPayloadWithId {
  [key: string]: unknown;
  eventId?: string;
}

// Track connected clients for cleanup
const sseClients: Map<string, SSEClient> = new Map();

/**
 * OPTIONS /events - Handle CORS preflight
 */
router.options('/', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

/**
 * GET /events - SSE endpoint
 *
 * Establishes Server-Sent Events connection with:
 * - Heartbeat every 30 seconds (from HEARTBEAT_INTERVAL_MS)
 * - Timeout after 2 minutes of inactivity (from CONNECTION_TIMEOUT_MS)
 * - Graceful cleanup on disconnect/error
 * - Event counting and metrics tracking
 */
router.get('/', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

  // Set CORS headers for SSE (specific origin, not wildcard)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Create client entry with metadata
  const clientId = uuidv4();
  const client: SSEClient = {
    id: clientId,
    res,
    createdAt: Date.now(),
    eventCount: 0,
  };

  sseClients.set(clientId, client);
  metricsCollector.setConnectedClients(sseClients.size);

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: 'connected',
      message: 'SSE connection established',
      clientId,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Heartbeat: send ping every 30 seconds (configurable)
  const heartbeatIntervalMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000');
  const heartbeatTimer = setInterval(() => {
    try {
      if (res.writable) {
        // SSE comment (no-op for clients, but keeps connection alive)
        res.write(':\n');
      } else {
        clearInterval(heartbeatTimer);
        cleanup();
      }
    } catch (error) {
      clearInterval(heartbeatTimer);
      cleanup();
    }
  }, heartbeatIntervalMs);

  // Timeout: close connection if no writes for 2 minutes (configurable)
  const connectionTimeoutMs = parseInt(process.env.CONNECTION_TIMEOUT_MS || '120000');
  let lastActivityTime = Date.now();
  const timeoutTimer = setInterval(() => {
    if (Date.now() - lastActivityTime > connectionTimeoutMs) {
      cleanup();
    }
  }, connectionTimeoutMs / 2);

  // Track writes to update last activity time
  const originalWrite = res.write.bind(res);
  res.write = ((chunk: Buffer | string, encoding?: BufferEncoding | (() => void), callback?: (() => void) | undefined) => {
    lastActivityTime = Date.now();
    client.eventCount++;
    if (typeof encoding === 'function') {
      return originalWrite(chunk, encoding);
    }
    if (typeof callback === 'function') {
      return originalWrite(chunk, encoding as BufferEncoding, callback);
    }
    return originalWrite(chunk, encoding as BufferEncoding);
  }) as unknown as typeof res.write;

  // Cleanup function: called on disconnect, error, or timeout
  const cleanup = () => {
    clearInterval(heartbeatTimer);
    clearInterval(timeoutTimer);
    sseClients.delete(clientId);
    metricsCollector.setConnectedClients(sseClients.size);
    try {
      res.end();
    } catch (error) {
      // Connection already closed
    }
  };

  // Handle client disconnect (browser tab closed, request cancelled)
  req.on('close', () => {
    cleanup();
  });

  // Handle request errors
  req.on('error', () => {
    cleanup();
  });

  // Handle response errors
  res.on('error', () => {
    cleanup();
  });
});

/**
 * Broadcast event to all connected SSE clients
 *
 * Tracks metrics: latency, success/failure, client counts
 * Deduplicates events to prevent multiple broadcasts of same event
 * Handles client errors and cleanup automatically
 */
function broadcastEvent(eventType: string, data: EventPayloadWithId): void {
  // Check for duplicate if eventId provided
  if (data.eventId && typeof data.eventId === 'string') {
    if (dedup.isDuplicate(data.eventId, Date.now())) {
      metricsCollector.recordDuplicate();
      return;
    }
    dedup.mark(data.eventId, Date.now());
  }

  // Record emission
  metricsCollector.recordEmitted(eventType);

  const message = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  const startTime = Date.now();
  let broadcastCount = 0;

  // Broadcast to all connected clients
  for (const [clientId, client] of sseClients.entries()) {
    try {
      if (client.res.writable) {
        client.res.write(`event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`);
        broadcastCount++;
      } else {
        sseClients.delete(clientId);
        metricsCollector.recordFailedBroadcast();
      }
    } catch (error) {
      sseClients.delete(clientId);
      metricsCollector.recordBroadcastError();
    }
  }

  // Record broadcast metrics if any clients received it
  if (broadcastCount > 0) {
    const latencyMs = Date.now() - startTime;
    metricsCollector.recordBroadcasted(latencyMs, eventType);
  }

  metricsCollector.setConnectedClients(sseClients.size);
}

/**
 * Register event listeners
 *
 * These will broadcast to all connected SSE clients.
 * Events from both file uploads/webhooks and GraphQL mutations.
 */

// Events from file uploads and webhooks
eventBus.on('fileUploaded', (data: EventPayloadWithId) => {
  broadcastEvent('fileUploaded', data);
});

eventBus.on('ciResults', (data: EventPayloadWithId) => {
  broadcastEvent('ciResults', data);
});

eventBus.on('sensorData', (data: EventPayloadWithId) => {
  broadcastEvent('sensorData', data);
});

// Events from GraphQL mutations
eventBus.on('buildCreated', (data: EventPayloadWithId) => {
  broadcastEvent('buildCreated', data);
});

eventBus.on('buildStatusChanged', (data: EventPayloadWithId) => {
  broadcastEvent('buildStatusChanged', data);
});

eventBus.on('partAdded', (data: EventPayloadWithId) => {
  broadcastEvent('partAdded', data);
});

eventBus.on('testRunSubmitted', (data: EventPayloadWithId) => {
  broadcastEvent('testRunSubmitted', data);
});

/**
 * GET /health - Health check
 *
 * Returns current status of SSE endpoint including connected client count
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedClients: sseClients.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /metrics - Get event bus metrics and client details
 *
 * Returns comprehensive metrics including:
 * - Event counts (total emitted, broadcast, duplicates, errors)
 * - Latency statistics (average, min, max)
 * - Per-event-type counts
 * - Client details (connection time, event count)
 *
 * Useful for observability dashboards, performance monitoring, debugging
 */
router.get('/metrics', (_req, res) => {
  const metrics = metricsCollector.getMetrics();
  const clientDetails = Array.from(sseClients.values()).map((client) => ({
    id: client.id,
    connectedFor: Date.now() - client.createdAt,
    eventCount: client.eventCount,
  }));

  res.json({
    metrics,
    clientDetails,
    deduplicatorStats: dedup.getStats(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /emit - Receive events from GraphQL backend
 *
 * Accepts HTTP POST from Apollo GraphQL server when mutations complete.
 *
 * Authentication: Requires Authorization header with shared event secret
 * Prevents event injection attacks from unauthorized clients
 *
 * Body format: { event: string, payload: any, timestamp?: string }
 */
router.post(
  '/emit',
  express.json(),
  validateEventSecret, // ✅ Authenticate request before processing
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { event, payload } = req.body;

    if (!event) {
      res.status(400).json({
        error: 'missing_event',
        message: 'Request body must include "event" field',
      });
      return;
    }

    if (!payload) {
      res.status(400).json({
        error: 'missing_payload',
        message: 'Request body must include "payload" field',
      });
      return;
    }

    // Emit to event bus, which broadcasts to all SSE clients
    eventBus.emit(event, payload);

    res.json({ ok: true, event });
  })
);

export default router;

