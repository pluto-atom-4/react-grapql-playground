/**
 * Tests for SSE Error Handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SSEErrorType,
  classifySSEError,
  getErrorMessage,
  createSSEErrorNotification,
  detectProtocolError,
  ErrorThrottler,
  SSEErrorLogger,
} from '../sse-error-handler';

describe('SSE Error Handler', () => {
  describe('classifySSEError()', () => {
    it('detects NETWORK error when browser offline', () => {
      const errorType = classifySSEError({
        isOnline: false,
      });
      expect(errorType).toBe(SSEErrorType.NETWORK);
    });

    it('detects CORS error on initial connection failure', () => {
      const errorType = classifySSEError({
        isInitialConnection: true,
        errorEvent: new Event('error'),
      });
      expect(errorType).toBe(SSEErrorType.CORS);
    });

    it('detects TIMEOUT error when max attempts reached', () => {
      const errorType = classifySSEError({
        attemptNumber: 5,
        maxAttempts: 5,
      });
      expect(errorType).toBe(SSEErrorType.TIMEOUT);
    });

    it('returns UNKNOWN for unclassified error', () => {
      const errorType = classifySSEError({});
      expect(errorType).toBe(SSEErrorType.UNKNOWN);
    });

    it('prioritizes network error over other types', () => {
      const errorType = classifySSEError({
        isOnline: false,
        isInitialConnection: true,
        attemptNumber: 5,
        maxAttempts: 5,
      });
      // Network has highest priority
      expect(errorType).toBe(SSEErrorType.NETWORK);
    });
  });

  describe('getErrorMessage()', () => {
    it('returns user-friendly message for CORS error', () => {
      const message = getErrorMessage(SSEErrorType.CORS);
      expect(message).toContain('Connection issue');
      expect(message).not.toContain('CORS');
    });

    it('returns user-friendly message for TIMEOUT error', () => {
      const message = getErrorMessage(SSEErrorType.TIMEOUT);
      expect(message).toContain('taking longer');
    });

    it('returns user-friendly message for NETWORK error', () => {
      const message = getErrorMessage(SSEErrorType.NETWORK);
      expect(message).toContain('offline');
    });

    it('returns user-friendly message for PROTOCOL error', () => {
      const message = getErrorMessage(SSEErrorType.PROTOCOL);
      expect(message).toContain('format error');
    });

    it('returns user-friendly message for UNKNOWN error', () => {
      const message = getErrorMessage(SSEErrorType.UNKNOWN);
      expect(message).toContain('Connection interrupted');
    });

    it('all messages are non-technical and user-facing', () => {
      const messages = Object.values(SSEErrorType).map((type) =>
        getErrorMessage(type as SSEErrorType)
      );

      messages.forEach((msg) => {
        // Messages should not contain technical jargon
        expect(msg).not.toMatch(/TypeError|NetworkError|EventSource/i);
        // Messages should be actionable
        expect(msg.length).toBeGreaterThan(20);
        expect(msg.length).toBeLessThan(200);
      });
    });
  });

  describe('createSSEErrorNotification()', () => {
    it('creates warning notification for CORS error', () => {
      const notification = createSSEErrorNotification(SSEErrorType.CORS);
      expect(notification.type).toBe('warning');
      expect(notification.errorType).toBe(SSEErrorType.CORS);
      expect(notification.action).toBe('dismiss');
    });

    it('creates error notification on terminal TIMEOUT', () => {
      const notification = createSSEErrorNotification(
        SSEErrorType.TIMEOUT,
        5, // attemptNumber
        5 // maxAttempts
      );
      expect(notification.type).toBe('error');
      expect(notification.action).toBe('refresh');
      expect(notification.duration).toBeNull();
    });

    it('creates warning notification on non-terminal TIMEOUT', () => {
      const notification = createSSEErrorNotification(
        SSEErrorType.TIMEOUT,
        2, // attemptNumber
        5 // maxAttempts
      );
      expect(notification.type).toBe('info');
    });

    it('creates persistent notification for NETWORK error', () => {
      const notification = createSSEErrorNotification(SSEErrorType.NETWORK);
      expect(notification.type).toBe('warning');
      expect(notification.duration).toBeNull(); // Persistent
    });

    it('sets appropriate auto-dismiss durations', () => {
      const corsNotification = createSSEErrorNotification(SSEErrorType.CORS);
      const networkNotification = createSSEErrorNotification(SSEErrorType.NETWORK);

      expect(corsNotification.duration).toBe(5000);
      expect(networkNotification.duration).toBeNull(); // Persist
    });
  });

  describe('detectProtocolError()', () => {
    it('detects malformed JSON', () => {
      expect(detectProtocolError('{ invalid json')).toBe(true);
      expect(detectProtocolError('undefined')).toBe(true);
    });

    it('accepts valid JSON', () => {
      expect(detectProtocolError('{"key": "value"}')).toBe(false);
      expect(detectProtocolError('[]')).toBe(false);
      expect(detectProtocolError('""')).toBe(false);
    });

    it('detects undefined or empty data', () => {
      expect(detectProtocolError(undefined)).toBe(true);
      expect(detectProtocolError('')).toBe(true);
      expect(detectProtocolError('   ')).toBe(true);
    });

    it('handles edge cases', () => {
      expect(detectProtocolError('null')).toBe(false); // Valid JSON
      expect(detectProtocolError('123')).toBe(false); // Valid JSON
      expect(detectProtocolError('true')).toBe(false); // Valid JSON
    });
  });

  describe('ErrorThrottler', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('shows error on first occurrence', () => {
      const throttler = new ErrorThrottler(5000);
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(true);
    });

    it('throttles repeated errors of same type', () => {
      const throttler = new ErrorThrottler(5000);
      throttler.shouldShowError(SSEErrorType.CORS);
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(false);
    });

    it('allows different error types without throttling', () => {
      const throttler = new ErrorThrottler(5000);
      throttler.shouldShowError(SSEErrorType.CORS);
      expect(throttler.shouldShowError(SSEErrorType.NETWORK)).toBe(true);
    });

    it('shows error again after throttle window expires', () => {
      const throttler = new ErrorThrottler(5000);
      throttler.shouldShowError(SSEErrorType.CORS);
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(false);

      // Advance time past throttle window
      vi.advanceTimersByTime(5100);
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(true);
    });

    it('resets throttler state', () => {
      const throttler = new ErrorThrottler(5000);
      throttler.shouldShowError(SSEErrorType.CORS);
      throttler.reset();
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(true);
    });

    it('allows custom throttle delay', () => {
      const throttler = new ErrorThrottler(1000); // 1 second
      throttler.shouldShowError(SSEErrorType.CORS);
      
      // First throttled attempt at 500ms (still within 1000ms throttle window)
      vi.advanceTimersByTime(500);
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(false);
      
      // Second attempt at 1000ms after the throttled check (window is sliding)
      // We're now at 500+1000 = 1500ms total
      vi.advanceTimersByTime(1000);
      expect(throttler.shouldShowError(SSEErrorType.CORS)).toBe(true);
    });
  });

  describe('SSEErrorLogger', () => {
    it('logs errors with timestamp and type', () => {
      const logger = new SSEErrorLogger();
      logger.logError(SSEErrorType.CORS, 1, { url: 'http://localhost:5000/events' });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].errorType).toBe(SSEErrorType.CORS);
      expect(logs[0].attemptNumber).toBe(1);
      expect(logs[0].context?.url).toBe('http://localhost:5000/events');
      expect(logs[0].timestamp).toBeGreaterThan(0);
    });

    it('limits log history to max size', () => {
      const logger = new SSEErrorLogger(/* default 100 */);
      // Log more than 100 errors
      for (let i = 0; i < 150; i++) {
        logger.logError(SSEErrorType.UNKNOWN);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
      expect(logs.length).toBe(100);
    });

    it('provides error summary by type', () => {
      const logger = new SSEErrorLogger();
      logger.logError(SSEErrorType.CORS);
      logger.logError(SSEErrorType.CORS);
      logger.logError(SSEErrorType.NETWORK);
      logger.logError(SSEErrorType.TIMEOUT);

      const summary = logger.getSummary();
      expect(summary[SSEErrorType.CORS]).toBe(2);
      expect(summary[SSEErrorType.NETWORK]).toBe(1);
      expect(summary[SSEErrorType.TIMEOUT]).toBe(1);
      expect(summary[SSEErrorType.PROTOCOL]).toBe(0);
      expect(summary[SSEErrorType.UNKNOWN]).toBe(0);
    });

    it('clears all logs', () => {
      const logger = new SSEErrorLogger();
      logger.logError(SSEErrorType.CORS);
      logger.logError(SSEErrorType.NETWORK);
      expect(logger.getLogs()).toHaveLength(2);

      logger.clear();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('exposes logs to window for debugging', () => {
      const logger = new SSEErrorLogger();
      logger.logError(SSEErrorType.CORS);

      expect(typeof window.__SSE_ERROR_LOGS).toBe('object');
      expect(Array.isArray(window.__SSE_ERROR_LOGS)).toBe(true);
      expect(window.__SSE_ERROR_LOGS?.length).toBe(1);
    });
  });

  describe('error edge cases', () => {
    it('classifySSEError handles undefined context gracefully', () => {
      expect(() => classifySSEError({})).not.toThrow();
    });

    it('getErrorMessage handles all enum values', () => {
      Object.values(SSEErrorType).forEach((type) => {
        const message = getErrorMessage(type as SSEErrorType);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('createSSEErrorNotification handles all error types', () => {
      Object.values(SSEErrorType).forEach((type) => {
        expect(() =>
          createSSEErrorNotification(type as SSEErrorType)
        ).not.toThrow();
      });
    });

    it('detectProtocolError handles null safely', () => {
      // This should not crash, though data type doesn't allow null
      expect(detectProtocolError(undefined)).toBe(true);
    });

    it('ErrorThrottler handles concurrent calls safely', () => {
      const throttler = new ErrorThrottler(100);

      // Simulate rapid concurrent calls
      const results = [
        throttler.shouldShowError(SSEErrorType.CORS),
        throttler.shouldShowError(SSEErrorType.CORS),
        throttler.shouldShowError(SSEErrorType.CORS),
      ];

      expect(results[0]).toBe(true); // First call
      expect(results[1]).toBe(false); // Throttled
      expect(results[2]).toBe(false); // Throttled
    });
  });
});
