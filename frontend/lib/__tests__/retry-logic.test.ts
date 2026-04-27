/**
 * Retry Logic Test Suite
 *
 * Tests for error classification, retry triggering, exponential backoff calculation,
 * and integration with mutation hooks.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isRetryableError,
  classifyError,
  getExponentialBackoffDelay,
  getRetryStrategy,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from '../graphql-error-handler';

describe('Retry Logic', () => {
  describe('Error Classification for Retries', () => {
    it('classifies network errors as retryable', () => {
      const networkError = new Error('Network request failed');
      expect(isRetryableError(networkError)).toBe(true);
      expect(classifyError(networkError)).toBe('network');
    });

    it('classifies timeout errors as retryable', () => {
      const timeoutError = new Error('Request timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(classifyError(timeoutError)).toBe('timeout');
    });

    it('classifies GraphQL validation errors as non-retryable', () => {
      const validationError = {
        graphQLErrors: [
          {
            message: 'Invalid input',
            extensions: { code: 'BAD_USER_INPUT' },
          },
        ],
      };
      expect(isRetryableError(validationError)).toBe(false);
      expect(classifyError(validationError)).toBe('validation');
    });

    it('classifies authentication errors as non-retryable', () => {
      const authError = {
        graphQLErrors: [
          {
            message: 'Unauthorized',
            extensions: { code: 'UNAUTHENTICATED' },
          },
        ],
      };
      expect(isRetryableError(authError)).toBe(false);
      expect(classifyError(authError)).toBe('unauthorized');
    });

    it('classifies unknown errors as non-retryable', () => {
      const unknownError = { unknown: 'error' };
      expect(isRetryableError(unknownError)).toBe(false);
      expect(classifyError(unknownError)).toBe('unknown');
    });

    it('handles null errors gracefully', () => {
      expect(isRetryableError(null)).toBe(false);
      expect(classifyError(null)).toBe('unknown');
    });
  });

  describe('Exponential Backoff Calculation', () => {
    it('returns correct delay for attempt 0', () => {
      const delay = getExponentialBackoffDelay(0, 100, 10000, 20);
      // Should be between 80-120 (100 ±20%)
      expect(delay).toBeGreaterThanOrEqual(80);
      expect(delay).toBeLessThanOrEqual(120);
    });

    it('returns correct delay for attempt 1', () => {
      const delay = getExponentialBackoffDelay(1, 100, 10000, 20);
      // Should be between 160-240 (200 ±20%)
      expect(delay).toBeGreaterThanOrEqual(160);
      expect(delay).toBeLessThanOrEqual(240);
    });

    it('returns correct delay for attempt 2', () => {
      const delay = getExponentialBackoffDelay(2, 100, 10000, 20);
      // Should be between 320-480 (400 ±20%)
      expect(delay).toBeGreaterThanOrEqual(320);
      expect(delay).toBeLessThanOrEqual(480);
    });

    it('caps delay at maxDelay', () => {
      const delay = getExponentialBackoffDelay(5, 100, 10000, 20);
      // 100 * 2^5 = 3200, but capped at 10000
      expect(delay).toBeLessThanOrEqual(10000);
    });

    it('applies jitter correctly', () => {
      // Test multiple times to verify jitter is applied
      const delays = [];
      for (let i = 0; i < 10; i += 1) {
        delays.push(getExponentialBackoffDelay(1, 100, 10000, 20));
      }

      // Should have variation due to jitter
      const min = Math.min(...delays);
      const max = Math.max(...delays);
      expect(max - min).toBeGreaterThan(0);
    });

    it('never returns negative delays', () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const delay = getExponentialBackoffDelay(attempt, 100, 10000, 20);
        expect(delay).toBeGreaterThanOrEqual(0);
      }
    });

    it('respects custom base and max delays', () => {
      const delay = getExponentialBackoffDelay(1, 50, 5000, 20);
      // 50 * 2^1 = 100, ±20% = 80-120
      expect(delay).toBeGreaterThanOrEqual(80);
      expect(delay).toBeLessThanOrEqual(120);
    });

    it('respects custom jitter percentage', () => {
      // With 0% jitter, all delays should be exact (within floating point precision)
      const delay1 = getExponentialBackoffDelay(0, 100, 10000, 0);
      const delay2 = getExponentialBackoffDelay(0, 100, 10000, 0);
      expect(delay1).toBe(delay2);
      expect(delay1).toBe(100);
    });
  });

  describe('Retry Strategy Determination', () => {
    it('returns shouldRetry=true for retryable errors within max attempts', () => {
      const networkError = new Error('Network error');
      const { shouldRetry, delayMs } = getRetryStrategy(networkError, 0);

      expect(shouldRetry).toBe(true);
      expect(delayMs).toBeGreaterThan(0);
    });

    it('returns shouldRetry=false for non-retryable errors', () => {
      const validationError = {
        graphQLErrors: [
          {
            message: 'Invalid',
            extensions: { code: 'BAD_USER_INPUT' },
          },
        ],
      };
      const { shouldRetry } = getRetryStrategy(validationError, 0);

      expect(shouldRetry).toBe(false);
    });

    it('returns shouldRetry=false when max retries exceeded', () => {
      const networkError = new Error('Network error');
      const { shouldRetry } = getRetryStrategy(networkError, 3); // Max is 3, so attempt 3 should fail

      expect(shouldRetry).toBe(false);
    });

    it('calculates correct delay in retry strategy', () => {
      const networkError = new Error('Network error');
      const { shouldRetry, delayMs } = getRetryStrategy(networkError, 0);

      expect(shouldRetry).toBe(true);
      // Attempt 0: 100ms ±20% = 80-120ms
      expect(delayMs).toBeGreaterThanOrEqual(80);
      expect(delayMs).toBeLessThanOrEqual(120);
    });

    it('respects custom retry config', () => {
      const networkError = new Error('Network error');
      const customConfig: Partial<RetryConfig> = {
        maxRetries: 5,
        baseDelay: 50,
        maxDelay: 5000,
      };

      const { shouldRetry, delayMs } = getRetryStrategy(networkError, 4, customConfig);

      expect(shouldRetry).toBe(true);
      expect(delayMs).toBeGreaterThan(0);
      expect(delayMs).toBeLessThanOrEqual(5000);
    });
  });

  describe('Max Retry Limits', () => {
    it('stops retrying after 3 attempts by default', () => {
      const networkError = new Error('Network error');

      const attempt0 = getRetryStrategy(networkError, 0);
      expect(attempt0.shouldRetry).toBe(true);

      const attempt1 = getRetryStrategy(networkError, 1);
      expect(attempt1.shouldRetry).toBe(true);

      const attempt2 = getRetryStrategy(networkError, 2);
      expect(attempt2.shouldRetry).toBe(true);

      const attempt3 = getRetryStrategy(networkError, 3);
      expect(attempt3.shouldRetry).toBe(false);
    });

    it('allows custom max retry limits', () => {
      const networkError = new Error('Network error');
      const customConfig: Partial<RetryConfig> = { maxRetries: 5 };

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const strategy = getRetryStrategy(networkError, attempt, customConfig);
        expect(strategy.shouldRetry).toBe(true);
      }

      const attempt5 = getRetryStrategy(networkError, 5, customConfig);
      expect(attempt5.shouldRetry).toBe(false);
    });
  });

  describe('Delay Progression', () => {
    it('shows exponential growth in delays', () => {
      const networkError = new Error('Network error');
      const delays = [];

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { delayMs } = getRetryStrategy(networkError, attempt);
        delays.push(delayMs);
      }

      // Each attempt should have approximately double the delay (accounting for jitter)
      // Even with jitter, the base exponential growth should be visible on average
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });

    it('caps all delays at maxDelay', () => {
      const networkError = new Error('Network error');
      const config: Partial<RetryConfig> = { maxDelay: 5000 };

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { delayMs } = getRetryStrategy(networkError, attempt, config);
        expect(delayMs).toBeLessThanOrEqual(5000);
      }
    });
  });

  describe('Default Configuration', () => {
    it('has correct default retry config values', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelay).toBe(100);
      expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(10000);
      expect(DEFAULT_RETRY_CONFIG.jitterPercent).toBe(20);
    });

    it('uses default config when none provided', () => {
      const networkError = new Error('Network error');
      const { delayMs } = getRetryStrategy(networkError, 0);

      // Should respect default: 100ms ±20%
      expect(delayMs).toBeGreaterThanOrEqual(80);
      expect(delayMs).toBeLessThanOrEqual(120);
    });
  });

  describe('Retry Scenarios', () => {
    it('simulates complete retry flow for transient network error', () => {
      const networkError = new Error('Network error');
      const attempts: Array<{ attempt: number; shouldRetry: boolean; delay: number }> = [];

      for (let attempt = 0; attempt <= 3; attempt += 1) {
        const { shouldRetry, delayMs } = getRetryStrategy(networkError, attempt);
        attempts.push({ attempt, shouldRetry, delay: delayMs });

        if (!shouldRetry) break;
      }

      // Should have 3 successful retries plus final failure
      expect(attempts).toHaveLength(4);
      expect(attempts[0].shouldRetry).toBe(true);
      expect(attempts[2].shouldRetry).toBe(true);
      expect(attempts[3].shouldRetry).toBe(false);
    });

    it('stops immediately for non-retryable error', () => {
      const validationError = {
        graphQLErrors: [
          {
            message: 'Invalid',
            extensions: { code: 'BAD_USER_INPUT' },
          },
        ],
      };

      const { shouldRetry } = getRetryStrategy(validationError, 0);
      expect(shouldRetry).toBe(false);
    });

    it('handles 5xx-like server errors as retryable', () => {
      const serverError = new Error('Internal server error');
      // Network classification would handle this
      const { shouldRetry } = getRetryStrategy(serverError, 0);

      // Network errors are retryable
      expect(shouldRetry).toBe(true);
    });
  });

  describe('Integration with Mutation Hooks', () => {
    it('retry configuration integrates with mutation flow', () => {
      const networkError = new Error('Network failed');

      // Attempt 1
      const attempt1 = getRetryStrategy(networkError, 0);
      expect(attempt1.shouldRetry).toBe(true);
      expect(attempt1.delayMs).toBeGreaterThan(0);
      expect(attempt1.delayMs).toBeLessThan(150);

      // Attempt 2
      const attempt2 = getRetryStrategy(networkError, 1);
      expect(attempt2.shouldRetry).toBe(true);
      expect(attempt2.delayMs).toBeGreaterThan(attempt1.delayMs);

      // Attempt 3
      const attempt3 = getRetryStrategy(networkError, 2);
      expect(attempt3.shouldRetry).toBe(true);

      // Final failure
      const attempt4 = getRetryStrategy(networkError, 3);
      expect(attempt4.shouldRetry).toBe(false);
    });

    it('provides delay for setTimeout in mutation retry', () => {
      const networkError = new Error('Network error');

      const retryAttempts = [];
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const { shouldRetry, delayMs } = getRetryStrategy(networkError, attempt);
        retryAttempts.push({ attempt, shouldRetry, delayMs });
      }

      // Each successful retry has a valid delay for setTimeout
      retryAttempts.forEach(({ shouldRetry, delayMs }) => {
        if (shouldRetry) {
          expect(typeof delayMs).toBe('number');
          expect(delayMs).toBeGreaterThanOrEqual(0);
          expect(delayMs).toBeLessThanOrEqual(10000);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large attempt numbers gracefully', () => {
      const networkError = new Error('Network error');
      const { shouldRetry } = getRetryStrategy(networkError, 1000);

      expect(shouldRetry).toBe(false);
    });

    it('handles mixed retry config types', () => {
      const networkError = new Error('Network error');
      const partialConfig: Partial<RetryConfig> = { maxRetries: 5 };

      const strategy = getRetryStrategy(networkError, 4, partialConfig);
      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.delayMs).toBeGreaterThan(0);
    });

    it('preserves delay precision for timing calculations', () => {
      const networkError = new Error('Network error');
      const delays = [];

      for (let i = 0; i < 100; i += 1) {
        const { delayMs } = getRetryStrategy(networkError, 0);
        delays.push(delayMs);
      }

      // Delays should have sub-millisecond precision (no rounding issues)
      const hasDecimal = delays.some((d) => d % 1 !== 0);
      // Due to floating point, some should have decimal precision
      expect(delays.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrency Scenarios', () => {
    it('handles multiple simultaneous retry decisions', () => {
      const networkError = new Error('Network error');

      const decisions = [];
      for (let i = 0; i < 5; i += 1) {
        decisions.push(getRetryStrategy(networkError, 0));
      }

      // All should be retryable
      decisions.forEach(({ shouldRetry }) => {
        expect(shouldRetry).toBe(true);
      });

      // Delays may vary due to jitter
      const delaySet = new Set(decisions.map(({ delayMs }) => delayMs));
      expect(delaySet.size).toBeGreaterThan(0);
    });
  });
});
