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

import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { eventBus } from '../services/event-bus.ts'

const router = Router()

// Track connected clients for cleanup
const connectedClients: Set<Response> = new Set()

/**
 * GET /events - SSE endpoint
 * Establishes Server-Sent Events connection
 */
router.get('/', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Send initial connection message
  res.write(
    `data: ${JSON.stringify({
      type: 'connected',
      message: 'SSE connection established',
      clientId: uuidv4(),
      timestamp: new Date().toISOString(),
    })}\n\n`
  )

  // Track this client
  connectedClients.add(res)

  // Handle disconnect
  res.on('close', () => {
    connectedClients.delete(res)
  })

  res.on('error', () => {
    connectedClients.delete(res)
  })

  // Send keep-alive heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (res.writable) {
      res.write(`: heartbeat ${new Date().toISOString()}\n\n`)
    } else {
      clearInterval(heartbeat)
      connectedClients.delete(res)
    }
  }, 30000)
})

/**
 * Broadcast event to all connected SSE clients
 */
function broadcastEvent(eventType: string, data: unknown) {
  const message = {
    type: eventType,
    data,
    timestamp: new Date().toISOString(),
  }

  connectedClients.forEach((client) => {
    if (client.writable) {
      client.write(
        `event: ${eventType}\ndata: ${JSON.stringify(message)}\n\n`
      )
    } else {
      connectedClients.delete(client)
    }
  })
}

/**
 * Register event listeners
 * These will broadcast to all connected SSE clients
 */
eventBus.on('fileUploaded', (data) => {
  broadcastEvent('fileUploaded', data)
})

eventBus.on('ciResults', (data) => {
  broadcastEvent('ciResults', data)
})

eventBus.on('sensorData', (data) => {
  broadcastEvent('sensorData', data)
})

/**
 * GET /health - Health check
 * Returns number of connected SSE clients
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedClients: connectedClients.size,
    timestamp: new Date().toISOString(),
  })
})

export default router
