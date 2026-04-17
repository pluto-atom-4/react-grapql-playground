/**
 * Event Bus Service
 *
 * Provides a centralized event emitter for loosely coupled communication
 * between Express routes and real-time event listeners (SSE, etc.)
 *
 * Events:
 * - fileUploaded: { fileId, buildId, fileName, timestamp }
 * - ciResults: { buildId, status, testsPassed, testsFailed, timestamp }
 * - sensorData: { buildId, sensorType, value, timestamp }
 */

import { EventEmitter } from 'events'

class EventBus extends EventEmitter {
  constructor() {
    super()
    // Set max listeners to prevent memory leak warnings
    this.setMaxListeners(100)
  }

  // Emit typed events with timestamps
  emitFileUploaded(data: {
    fileId: string
    buildId?: string
    fileName: string
  }) {
    this.emit('fileUploaded', {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }

  emitCIResults(data: {
    buildId: string
    status: string
    testsPassed?: number
    testsFailed?: number
  }) {
    this.emit('ciResults', {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }

  emitSensorData(data: {
    buildId: string
    sensorType: string
    value: unknown
  }) {
    this.emit('sensorData', {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }
}

export const eventBus = new EventBus()
