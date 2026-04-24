/**
 * Server-Sent Events (SSE) Route
 *
 * GET /events - Establishes SSE connection for real-time events
 *
 * Clients connect and receive streamed events:
 * - fileUploaded
 * - ciResults
 * - sensorData
 *
 * Keeps connection open and broadcasts events to all connected clients.
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../services/event-bus';
import { asyncHandler } from '../middleware/error';
import { validateEventSecret } from '../middleware/validateEventSecret';

const router: ExpressRouter = Router();

// Track connected clients for cleanup
const connectedClients: Set<Response> = new Set();

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
 * Establishes Server-Sent Events connection
 */
router.get('/', (_req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Set CORS headers for SSE (specific origin, not wildcard)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: 'connected',
      message: 'SSE connection established',
      clientId: uuidv4(),
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Track this client
  connectedClients.add(res);

  // Send keep-alive heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
    } else {
      clearInterval(heartbeat);
      connectedClients.delete(res);
    }
  }, 30000);

  // Handle disconnect
  res.on('close', () => {
    clearInterval(heartbeat);
    connectedClients.delete(res);
  });

  res.on('error', () => {
    clearInterval(heartbeat);
    connectedClients.delete(res);
  });
});

/**
 * Broadcast event to all connected SSE clients
 */
function broadcastEvent(eventType: string, data: unknown) {
  const message = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  connectedClients.forEach((client) => {
    if (client.writable) {
      client.write(`event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`);
    } else {
      connectedClients.delete(client);
    }
  });
}

/**
 * Register event listeners
 * These will broadcast to all connected SSE clients
 */

// Events from file uploads and webhooks
eventBus.on('fileUploaded', (data) => {
  broadcastEvent('fileUploaded', data);
});

eventBus.on('ciResults', (data) => {
  broadcastEvent('ciResults', data);
});

eventBus.on('sensorData', (data) => {
  broadcastEvent('sensorData', data);
});

// Events from GraphQL mutations
eventBus.on('buildCreated', (data) => {
  broadcastEvent('buildCreated', data);
});

eventBus.on('buildStatusChanged', (data) => {
  broadcastEvent('buildStatusChanged', data);
});

eventBus.on('partAdded', (data) => {
  broadcastEvent('partAdded', data);
});

eventBus.on('testRunSubmitted', (data) => {
  broadcastEvent('testRunSubmitted', data);
});

/**
 * GET /health - Health check
 * Returns number of connected SSE clients
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /emit - Receive events from GraphQL backend
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
