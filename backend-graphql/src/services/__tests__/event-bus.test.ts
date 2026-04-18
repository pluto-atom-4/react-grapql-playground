import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { emitEvent } from '../event-bus'

describe('Event Bus Service', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    // Clear environment
    delete process.env.EXPRESS_EVENT_URL
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should POST event to Express with correct format', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK',
    })

    const payload = { buildId: '123', build: { id: '123', name: 'Test Build' } }
    await emitEvent('buildCreated', payload)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]

    expect(url).toBe('http://localhost:5000/events/emit')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body as string)
    expect(body.event).toBe('buildCreated')
    expect(body.payload).toEqual(payload)
    expect(body.timestamp).toBeDefined()
  })

  it('should use EXPRESS_EVENT_URL from environment', async () => {
    process.env.EXPRESS_EVENT_URL = 'http://custom-express:5000/emit'
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK',
    })

    await emitEvent('testEvent', { test: true })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('http://custom-express:5000/emit')
  })

  it('should include ISO timestamp in event', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'OK',
    })

    const beforeCall = new Date()
    await emitEvent('buildStatusChanged', { status: 'RUNNING' })
    const afterCall = new Date()

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as Record<string, string>).body
    )
    const eventTimestamp = new Date(body.timestamp)

    expect(eventTimestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
    expect(eventTimestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime())
  })

  it('should not throw on network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    // Should not throw
    expect(async () => {
      await emitEvent('buildCreated', { buildId: '123' })
    }).not.toThrow()
  })

  it('should log error on network failure', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('Connection refused'))

    await emitEvent('buildCreated', { buildId: '123' })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Network error emitting event'),
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('should log error on non-ok HTTP status', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    await emitEvent('buildCreated', { buildId: '123' })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to emit event'),
      expect.stringContaining('Status: 500'),
      expect.stringContaining('Response:')
    )

    consoleErrorSpy.mockRestore()
  })

  it('should handle different event types', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    })

    const eventTypes = ['buildCreated', 'buildStatusChanged', 'partAdded', 'testRunSubmitted']

    for (const eventType of eventTypes) {
      await emitEvent(eventType, { data: 'test' })
    }

    expect(fetchMock).toHaveBeenCalledTimes(4)
    fetchMock.mock.calls.forEach((call: unknown[], index: number) => {
      const callArray = call as [string, Record<string, string>]
      const body = JSON.parse(callArray[1].body)
      expect(body.event).toBe(eventTypes[index])
    })
  })
})
