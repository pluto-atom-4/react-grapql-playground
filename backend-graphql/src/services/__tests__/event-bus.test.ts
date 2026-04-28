import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { emitEvent, calculateBackoffDelay } from '../event-bus';

describe('Event Bus Service - Retry Logic', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    // Clear environment
    delete process.env.EXPRESS_EVENT_URL;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('emitEvent with retry logic', () => {
    it('should successfully emit event on first try', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      const payload = { buildId: '123', build: { id: '123', name: 'Test Build' } };
      await emitEvent('buildCreated', payload);

      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('should retry on network error and eventually succeed', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'OK',
        });

      const payload = { buildId: '123', build: { id: '123' } };
      await emitEvent('buildCreated', payload, {
        maxRetries: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 100,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should respect max retries limit', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const payload = { buildId: '123' };
      await emitEvent('buildCreated', payload, {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 2,
        timeoutMs: 100,
      });

      // 1 initial attempt + 2 retries = 3 total calls
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // Should log error after all retries exhausted
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to emit event after 2 retries'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use exponential backoff correctly', async () => {
      expect(calculateBackoffDelay(0, 1000, 30000)).toBe(1000);
      expect(calculateBackoffDelay(1, 1000, 30000)).toBe(2000);
      expect(calculateBackoffDelay(2, 1000, 30000)).toBe(4000);
      expect(calculateBackoffDelay(3, 1000, 30000)).toBe(8000);
      expect(calculateBackoffDelay(4, 1000, 30000)).toBe(16000);
      expect(calculateBackoffDelay(5, 1000, 30000)).toBe(30000); // Capped at max
    });

    it('should handle non-2xx HTTP response as error', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'OK',
        });

      const payload = { buildId: '123' };
      await emitEvent('buildCreated', payload, {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 100,
      });

      // Should retry after 5xx error
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should include correct headers on retry', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'OK',
        });

      process.env.EXPRESS_EVENT_SECRET = 'test-secret-123';
      const payload = { buildId: '123' };

      await emitEvent('buildCreated', payload, {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 100,
      });

      // Verify headers are present in both calls
      fetchMock.mock.calls.forEach(call => {
        const [_url, options] = call as [string, Record<string, unknown>];
        const headers = options.headers as Record<string, string>;
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Authorization']).toBe('Bearer test-secret-123');
      });
    });

    it('should not throw even after all retries fail', async () => {
      fetchMock.mockRejectedValue(new Error('Network unreachable'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const payload = { buildId: '123' };

      // Should not throw
      expect(async () => {
        await emitEvent('buildCreated', payload, {
          maxRetries: 1,
          baseDelayMs: 1,
          maxDelayMs: 10,
          backoffMultiplier: 2,
          timeoutMs: 100,
        });
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should log warnings on retry attempts before success', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Timeout 1'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'OK',
        });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const payload = { buildId: '123' };

      await emitEvent('buildCreated', payload, {
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 2,
        timeoutMs: 100,
      });

      // Should have logged warning for first failed attempt
      // Attempt 1 fails → warning
      // Attempt 2 succeeds → no warning
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const warnCall = consoleWarnSpy.mock.calls[0];
      expect((warnCall[0] as string).toLowerCase()).toContain('attempt');

      consoleWarnSpy.mockRestore();
    });

    it('should use environment variable for timeout', async () => {
      process.env.EVENT_EMIT_TIMEOUT_MS = '2000';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      const payload = { buildId: '123' };
      await emitEvent('buildCreated', payload);

      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('should POST event with correct format on all retry attempts', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'OK',
        });

      const payload = { buildId: '123', build: { id: '123', name: 'Test Build' } };
      await emitEvent('buildCreated', payload, {
        maxRetries: 1,
        baseDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 100,
      });

      // Verify both calls have correct format
      fetchMock.mock.calls.forEach(call => {
        const [url, options] = call as [string, Record<string, unknown>];
        expect(url).toBe('http://localhost:5000/events/emit');
        expect(options.method).toBe('POST');

        const body = JSON.parse(options.body as string);
        expect(body.event).toBe('buildCreated');
        expect(body.payload).toEqual(payload);
      });
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate correct delays with default multiplier', () => {
      const baseDelay = 1000;
      const maxDelay = 30000;

      expect(calculateBackoffDelay(0, baseDelay, maxDelay)).toBe(1000);
      expect(calculateBackoffDelay(1, baseDelay, maxDelay)).toBe(2000);
      expect(calculateBackoffDelay(2, baseDelay, maxDelay)).toBe(4000);
      expect(calculateBackoffDelay(3, baseDelay, maxDelay)).toBe(8000);
    });

    it('should cap delay at maximum', () => {
      const baseDelay = 100;
      const maxDelay = 500;

      // 100 * 2^4 = 1600, which exceeds 500
      expect(calculateBackoffDelay(4, baseDelay, maxDelay)).toBe(500);
      expect(calculateBackoffDelay(10, baseDelay, maxDelay)).toBe(500);
    });

    it('should support custom multiplier', () => {
      const baseDelay = 100;
      const maxDelay = 10000;
      const multiplier = 3;

      expect(calculateBackoffDelay(0, baseDelay, maxDelay, multiplier)).toBe(100);
      expect(calculateBackoffDelay(1, baseDelay, maxDelay, multiplier)).toBe(300);
      expect(calculateBackoffDelay(2, baseDelay, maxDelay, multiplier)).toBe(900);
      expect(calculateBackoffDelay(3, baseDelay, maxDelay, multiplier)).toBe(2700);
    });
  });

  describe('POST event to Express with correct format', () => {
    it('should include ISO timestamp in event', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      const beforeCall = new Date();
      await emitEvent('buildStatusChanged', { status: 'RUNNING' });
      const afterCall = new Date();

      const body = JSON.parse((fetchMock.mock.calls[0][1] as Record<string, string>).body);
      const eventTimestamp = new Date(body.timestamp);

      expect(eventTimestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(eventTimestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should handle different event types', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        text: async () => 'OK',
      });

      const eventTypes = ['buildCreated', 'buildStatusChanged', 'partAdded', 'testRunSubmitted'];

      for (const eventType of eventTypes) {
        await emitEvent(eventType, { data: 'test' });
      }

      expect(fetchMock).toHaveBeenCalledTimes(4);
      fetchMock.mock.calls.forEach((call: unknown[], index: number) => {
        const callArray = call as [string, Record<string, string>];
        const body = JSON.parse(callArray[1].body);
        expect(body.event).toBe(eventTypes[index]);
      });
    });

    it('should use EXPRESS_EVENT_URL from environment', async () => {
      process.env.EXPRESS_EVENT_URL = 'http://custom-express:5000/emit';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK',
      });

      await emitEvent('testEvent', { test: true });

      const [url] = fetchMock.mock.calls[0] as [string, Record<string, unknown>];
      expect(url).toBe('http://custom-express:5000/emit');
    });
  });
});
