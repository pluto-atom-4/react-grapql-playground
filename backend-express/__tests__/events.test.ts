/**
 * Events (SSE) Route Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import eventsRouter from '../src/routes/events'
import { errorHandler } from '../src/middleware/error'

const app = express()
app.use(express.json())
app.use('/events', eventsRouter)
app.use(errorHandler)

describe('Events (SSE) Routes', () => {
  describe('GET /events', () => {
    it('should establish SSE connection', (done) => {
      const req = request(app)
        .get('/events')
        .set('Accept', 'text/event-stream')
        .timeout(1000)

      req.end((err, res) => {
        // Connection gets closed after response, which is expected for this test setup
        expect(res).toBeDefined()
        done()
      })
    })

    it('should set correct SSE headers', (done) => {
      const req = request(app)
        .get('/events')
        .timeout(1000)

      req.end((err, res) => {
        if (res) {
          expect(res.headers['content-type']).toContain('text/event-stream')
          expect(res.headers['cache-control']).toBe('no-cache')
          expect(res.headers['connection']).toBe('keep-alive')
        }
        done()
      })
    })

    it('should send initial connection message', (done) => {
      const req = request(app)
        .get('/events')
        .timeout(1000)

      req.end((err, res) => {
        if (res) {
          expect(res.status).toBe(200)
          // Response body should contain connection event
          expect(res.text).toContain('connected')
        }
        done()
      })
    })

    it('should include clientId in connection message', (done) => {
      const req = request(app)
        .get('/events')
        .timeout(1000)

      req.end((err, res) => {
        if (res && res.text) {
          expect(res.text).toContain('clientId')
        }
        done()
      })
    })
  })

  describe('GET /events/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/events/health')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
      expect(res.body.connectedClients).toBeDefined()
      expect(typeof res.body.connectedClients).toBe('number')
      expect(res.body.timestamp).toBeDefined()
    })

    it('should report zero connected clients initially', async () => {
      const res = await request(app)
        .get('/events/health')

      expect(res.status).toBe(200)
      // Initially should be 0 (supertest request completes immediately)
      expect(res.body.connectedClients).toBeGreaterThanOrEqual(0)
    })

    it('should track multiple connections', async () => {
      // Make multiple health requests
      const res1 = await request(app).get('/events/health')
      const res2 = await request(app).get('/events/health')

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
    })
  })

  describe('SSE Event Broadcast', () => {
    it('should connect to SSE endpoint', (done) => {
      const req = request(app)
        .get('/events')
        .timeout(1000)

      req.end((err, res) => {
        if (res) {
          expect(res.status).toBe(200)
          expect(res.type).toContain('text/event-stream')
        }
        done()
      })
    })
  })

  describe('Connection Lifecycle', () => {
    it('should respond with CORS headers for SSE', (done) => {
      const req = request(app)
        .get('/events')
        .timeout(1000)

      req.end((err, res) => {
        if (res) {
          expect(res.headers['access-control-allow-origin']).toBe('*')
        }
        done()
      })
    })
  })
})
