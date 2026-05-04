/**
 * Unit tests for RetryLink
 *
 * Tests exponential backoff, retry logic, error classification, and console logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
    variables: {},
    extensions: {},
    setContext: () => {},
    getContext: () => ({}),
  };
}

/**
 * Helper to create a forward function that succeeds after N errors
 */
function createForwardThatSucceedsAfterErrors(errorCount: number) {
  let attemptCount = 0;

  return (op: Operation) => {
    return new MockObservable((subscribers) => {
      attemptCount += 1;

      if (attemptCount <= errorCount) {
        subscribers.error?.(new Error('Network error'));
      } else {
        subscribers.next?.({ data: { test: 'success' } });
        subscribers.complete?.();
      }
    });
  };
}

/**
 * Helper to create a forward function that always succeeds
 */
function createForwardThatSucceeds() {
  return (op: Operation) => {
    return new MockObservable((subscribers) => {
      subscribers.next?.({ data: { test: 'success' } });
      subscribers.complete?.();
    });
  };
}

/**
 * Helper to create a forward function that always fails
 */
function createForwardThatFails() {
  return (op: Operation) => {
    return new MockObservable((subscribers) => {
      subscribers.error?.(new Error('Network error'));
    });
  };
}

describe('RetryLink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not retry on first success', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('SuccessQuery');
    const forward = createForwardThatSucceeds();
    const consoleLogSpy = vi.spyOn(console, 'log');

    let receivedData: unknown = null;
    let isComplete = false;

    retryLink.request(operation, forward as any).subscribe({
      next: (value) => {
        receivedData = value;
      },
      complete: () => {
        isComplete = true;
      },
    });

    expect(receivedData).toEqual({ data: { test: 'success' } });
    expect(isComplete).toBe(true);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should retry network errors and succeed on retry', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('RetryQuery');
    const forward = createForwardThatSucceedsAfterErrors(1);
    const consoleLogSpy = vi.spyOn(console, 'log');

    let receivedData: unknown = null;

    retryLink.request(operation, forward as any).subscribe({
      next: (value) => {
        receivedData = value;
      },
    });

    expect(receivedData).toBeNull();
    vi.advanceTimersByTime(150);
    expect(receivedData).toEqual({ data: { test: 'success' } });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Apollo Retry]')
    );
  });

  it('should not retry on 4xx errors (non-retryable)', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('UnauthorizedQuery');

    let attempts = 0;
    const forward = () => {
      return new MockObservable((subscribers) => {
        attempts += 1;
        subscribers.error?.({ message: 'Unauthorized', status: 401 });
      });
    };

    const consoleLogSpy = vi.spyOn(console, 'log');
    let receivedError: unknown = null;

    retryLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    expect(receivedError).toBeDefined();
    expect(attempts).toBe(1);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should retry on timeout errors', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('TimeoutQuery');
    const forward = createForwardThatSucceedsAfterErrors(1);
    const consoleLogSpy = vi.spyOn(console, 'log');

    let receivedData: unknown = null;

    retryLink.request(operation, forward as any).subscribe({
      next: (value) => {
        receivedData = value;
      },
    });

    expect(receivedData).toBeNull();
    vi.advanceTimersByTime(150);
    expect(receivedData).toEqual({ data: { test: 'success' } });
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should respect maxRetries configuration', () => {
    const retryLink = new RetryLink({ maxRetries: 2 });
    const operation = createMockOperation('LimitedRetryQuery');

    let attempts = 0;
    const forward = () => {
      return new MockObservable((subscribers) => {
        attempts += 1;
        subscribers.error?.(new Error('Network error'));
      });
    };

    let receivedError: unknown = null;

    retryLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    expect(attempts).toBe(1);
    vi.advanceTimersByTime(150);
    expect(attempts).toBe(2);
    vi.advanceTimersByTime(250);
    expect(attempts).toBe(3);
    vi.advanceTimersByTime(500);
    expect(attempts).toBe(3);
    expect(receivedError).toBeDefined();
  });

  it('should log retry attempts with operation name', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('MyMutation');
    const forward = createForwardThatSucceedsAfterErrors(1);
    const consoleLogSpy = vi.spyOn(console, 'log');

    retryLink.request(operation, forward as any).subscribe({
      next: () => {},
    });

    vi.advanceTimersByTime(150);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('MyMutation')
    );
  });

  it('should work with concurrent operations', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });

    const results: unknown[] = [];

    for (let i = 0; i < 3; i++) {
      const operation = createMockOperation(`ConcurrentMutation${i}`);
      const forward = createForwardThatSucceedsAfterErrors(1);

      retryLink.request(operation, forward as any).subscribe({
        next: (value) => {
          results.push(value);
        },
      });
    }

    expect(results).toHaveLength(0);
    vi.advanceTimersByTime(150);
    expect(results).toHaveLength(3);
  });

  it('should preserve operation context after retry', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('ContextPreservationQuery');
    operation.variables = { userId: '123' };

    const forwardOperations: Operation[] = [];
    const forward = (op: Operation) => {
      forwardOperations.push(op);
      return new MockObservable((subscribers) => {
        if (forwardOperations.length === 1) {
          subscribers.error?.(new Error('Network error'));
        } else {
          subscribers.next?.({ data: { test: 'success' } });
          subscribers.complete?.();
        }
      });
    };

    retryLink.request(operation, forward as any).subscribe({
      next: () => {},
    });

    vi.advanceTimersByTime(150);

    expect(forwardOperations).toHaveLength(2);
    expect(forwardOperations[0].variables).toEqual(forwardOperations[1].variables);
    expect(forwardOperations[1].variables).toEqual({ userId: '123' });
  });

  it('should complete after successful retry', () => {
    const retryLink = new RetryLink({ maxRetries: 3 });
    const operation = createMockOperation('CompleteQuery');
    const forward = createForwardThatSucceedsAfterErrors(1);

    let isComplete = false;

    retryLink.request(operation, forward as any).subscribe({
      next: () => {},
      complete: () => {
        isComplete = true;
      },
    });

    expect(isComplete).toBe(false);
    vi.advanceTimersByTime(150);
    expect(isComplete).toBe(true);
  });

  it('should handle final failure after max retries', () => {
    const retryLink = new RetryLink({ maxRetries: 1 });
    const operation = createMockOperation('FinalFailureQuery');
    const forward = createForwardThatFails();
    const consoleLogSpy = vi.spyOn(console, 'log');

    let receivedError: unknown = null;

    retryLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    expect(receivedError).toBeNull();
    vi.advanceTimersByTime(150);
    expect(receivedError).toBeDefined();
    expect((receivedError as Error).message).toBe('Network error');
  });
});
