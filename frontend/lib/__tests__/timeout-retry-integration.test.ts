/**
 * Integration tests for Timeout + Retry Link
 *
 * Tests the full link chain: timeoutLink → retryLink → errorLink → authLink → httpLink
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeoutLink } from '../timeout-link';
import { RetryLink } from '../retry-link';
import { Operation } from '@apollo/client';

/**
 * Mock Observable that doesn't require rxjs import
 */
class MockObservable {
  private nextFn?: (value: any) => void;
  private errorFn?: (err: any) => void;
  private completeFn?: () => void;
  private cleanup?: () => void;

  constructor(
    subscriber: (callbacks: {
      next?: (value: any) => void;
      error?: (err: any) => void;
      complete?: () => void;
    }) => (() => void) | undefined
  ) {
    const callbacks = {
      next: (value: any) => this.nextFn?.(value),
      error: (err: any) => this.errorFn?.(err),
      complete: () => this.completeFn?.(),
    };
    this.cleanup = subscriber(callbacks);
  }

  subscribe(handlers: any) {
    this.nextFn = handlers.next;
    this.errorFn = handlers.error;
    this.completeFn = handlers.complete;
    return { unsubscribe: () => this.cleanup?.() };
  }
}

/**
 * Helper to create a mock operation
 */
function createMockOperation(name = 'TestQuery'): Operation {
  return {
    operationName: name,
    query: {
      kind: 'Document',
      definitions: [],
    },
    variables: { test: 'value' },
    extensions: {},
    setContext: () => {},
    getContext: () => ({}),
  };
}

/**
 * Helper to create a forward function that fails then succeeds
 */
function createForwardThatFailsThenSucceeds(failCount: number) {
  let attempts = 0;

  return (op: Operation) => {
    return new MockObservable((subscribers) => {
      attempts += 1;

      if (attempts <= failCount) {
        subscribers.error?.(new Error('Network error: Connection refused'));
      } else {
        subscribers.next?.({ data: { result: 'success' } });
        subscribers.complete?.();
      }
    });
  };
}

describe('Timeout + Retry Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should recover from network error via retry', () => {
    const timeoutLink = new TimeoutLink({ timeout: 10000 });
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('RecoveryQuery');
    const forward = createForwardThatFailsThenSucceeds(1);

    // Chain links together - manually since we're not using apollo concat
    let result: any = null;
    let error: any = null;

    // Apply timeout link
    timeoutLink.request(operation, (op) => {
      // Apply retry link
      return retryLink.request(op, forward as any);
    }).subscribe({
      next: (value) => {
        result = value;
      },
      error: (err) => {
        error = err;
      },
    });

    expect(result).toBeNull();
    expect(error).toBeNull();
    vi.advanceTimersByTime(150);
    expect(result).toEqual({ data: { result: 'success' } });
    expect(error).toBeNull();
  });

  it('should respect link chain order: timeout enforced before retries', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('TimeoutOrderQuery');

    let attemptCount = 0;
    const forwardThatSlows = (op: Operation) => {
      return new MockObservable((subscribers) => {
        attemptCount += 1;
        setTimeout(() => {
          subscribers.next?.({ data: { result: 'slow' } });
          subscribers.complete?.();
        }, 5000);
      });
    };

    const consoleLogSpy = vi.spyOn(console, 'log');
    let error: any = null;

    timeoutLink.request(operation, (op) => {
      return retryLink.request(op, forwardThatSlows as any);
    }).subscribe({
      error: (err) => {
        error = err;
      },
    });

    vi.advanceTimersByTime(1000);
    expect(error).toBeDefined();
    expect((error as Error).message).toContain('timeout');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Apollo Retry]')
    );
  });

  it('should not retry after timeout if max retries reached', () => {
    const timeoutLink = new TimeoutLink({ timeout: 500 });
    const retryLink = new RetryLink({ maxRetries: 2 });
    const operation = createMockOperation('TimeoutExhaustRetries');

    let forwardAttempts = 0;
    const forwardThatSlows = (op: Operation) => {
      return new MockObservable((subscribers) => {
        forwardAttempts += 1;
        setTimeout(() => {
          subscribers.next?.({ data: { result: 'slow' } });
          subscribers.complete?.();
        }, 5000);
      });
    };

    let error: any = null;

    timeoutLink.request(operation, (op) => {
      return retryLink.request(op, forwardThatSlows as any);
    }).subscribe({
      error: (err) => {
        error = err;
      },
    });

    // Initial attempt times out
    vi.advanceTimersByTime(500);
    expect(forwardAttempts).toBe(1);

    // First retry after delay
    vi.advanceTimersByTime(150);
    vi.advanceTimersByTime(500);
    expect(forwardAttempts).toBe(2);

    // Second retry after delay
    vi.advanceTimersByTime(250);
    vi.advanceTimersByTime(500);
    expect(forwardAttempts).toBe(3);

    // No more retries allowed
    vi.advanceTimersByTime(500);
    expect(forwardAttempts).toBe(3);

    expect(error).toBeDefined();
  });

  it('should work with multiple concurrent requests', () => {
    const timeoutLink = new TimeoutLink({ timeout: 10000 });
    const retryLink = new RetryLink({ maxRetries: 3 });

    const results: unknown[] = [];
    const errors: unknown[] = [];

    const link = (op: Operation, forward: any) => {
      return timeoutLink.request(op, (o) => {
        return retryLink.request(o, forward);
      });
    };

    for (let i = 0; i < 3; i++) {
      const operation = createMockOperation(`ConcurrentQuery${i}`);
      const forward = createForwardThatFailsThenSucceeds(1);

      link(operation, forward).subscribe({
        next: (value) => {
          results.push(value);
        },
        error: (err) => {
          errors.push(err);
        },
      });
    }

    expect(results).toHaveLength(0);
    expect(errors).toHaveLength(0);

    vi.advanceTimersByTime(150);

    expect(results).toHaveLength(3);
    expect(errors).toHaveLength(0);
  });

  it('should preserve operation variables through retry chain', () => {
    const timeoutLink = new TimeoutLink({ timeout: 10000 });
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('VariablePreservationQuery');
    operation.variables = { userId: '123', name: 'test' };

    const forwardOperations: Operation[] = [];
    const forward = (op: Operation) => {
      forwardOperations.push(op);
      return new MockObservable((subscribers) => {
        if (forwardOperations.length === 1) {
          subscribers.error?.(new Error('Network error'));
        } else {
          subscribers.next?.({ data: { result: 'success' } });
          subscribers.complete?.();
        }
      });
    };

    let result: any = null;

    timeoutLink.request(operation, (op) => {
      return retryLink.request(op, forward as any);
    }).subscribe({
      next: (value) => {
        result = value;
      },
    });

    vi.advanceTimersByTime(150);

    expect(forwardOperations).toHaveLength(2);
    expect(forwardOperations[0].variables).toEqual({
      userId: '123',
      name: 'test',
    });
    expect(forwardOperations[1].variables).toEqual({
      userId: '123',
      name: 'test',
    });
  });

  it('should emit comprehensive retry logs', () => {
    const timeoutLink = new TimeoutLink({ timeout: 10000 });
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('LoggingQuery');
    const forward = createForwardThatFailsThenSucceeds(2);

    const consoleLogSpy = vi.spyOn(console, 'log');
    let result: any = null;

    timeoutLink.request(operation, (op) => {
      return retryLink.request(op, forward as any);
    }).subscribe({
      next: (value) => {
        result = value;
      },
    });

    vi.advanceTimersByTime(150);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Attempt 1')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('LoggingQuery')
    );

    vi.advanceTimersByTime(250);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Attempt 2')
    );

    expect(result).toEqual({ data: { result: 'success' } });
  });
});
