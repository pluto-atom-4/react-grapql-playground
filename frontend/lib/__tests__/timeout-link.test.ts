/**
 * Unit tests for TimeoutLink
 *
 * Tests timeout enforcement, error handling, cleanup, and concurrent requests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeoutLink } from '../timeout-link';
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
 * Helper to create a slow forward function that delays response
 */
function createSlowForward(delayMs: number, shouldError: boolean = false) {
  return (op: Operation) => {
    return new MockObservable((subscribers) => {
      const timeoutId = setTimeout(() => {
        if (shouldError) {
          subscribers.error?.(new Error('Network error'));
        } else {
          subscribers.next?.({ data: { test: 'success' } });
          subscribers.complete?.();
        }
      }, delayMs);

      return () => clearTimeout(timeoutId);
    });
  };
}

/**
 * Helper to create a fast forward function
 */
function createFastForward() {
  return (op: Operation) => {
    return new MockObservable((subscribers) => {
      subscribers.next?.({ data: { test: 'success' } });
      subscribers.complete?.();
    });
  };
}

describe('TimeoutLink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should timeout request after configured duration', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const operation = createMockOperation('SlowQuery');
    const forward = createSlowForward(5000);

    let receivedError: unknown = null;

    timeoutLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    expect(receivedError).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(receivedError).toBeDefined();
    expect((receivedError as Error).message).toContain('timeout');
  });

  it('should not timeout for successful responses within timeout window', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const operation = createMockOperation('FastQuery');
    const forward = createFastForward();

    let receivedData: unknown = null;
    let receivedError: unknown = null;
    let isComplete = false;

    timeoutLink.request(operation, forward as any).subscribe({
      next: (value) => {
        receivedData = value;
      },
      error: (err) => {
        receivedError = err;
      },
      complete: () => {
        isComplete = true;
      },
    });

    expect(receivedData).toEqual({ data: { test: 'success' } });
    expect(receivedError).toBeNull();
    expect(isComplete).toBe(true);
  });

  it('should respect custom timeout configuration', () => {
    const timeoutLink = new TimeoutLink({ timeout: 500 });
    const operation = createMockOperation('CustomTimeoutQuery');
    const forward = createSlowForward(2000);

    let receivedError: unknown = null;

    timeoutLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    vi.advanceTimersByTime(500);
    expect(receivedError).toBeDefined();
    expect((receivedError as Error).message).toContain('500ms');
  });

  it('should handle unsubscribe correctly', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const operation = createMockOperation('UnsubscribeQuery');
    const forward = createSlowForward(5000);

    let receivedError: unknown = null;

    const subscription = timeoutLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    subscription.unsubscribe();
    vi.advanceTimersByTime(1500);

    expect(receivedError).toBeNull();
  });

  it('should work with concurrent requests', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });

    const errors: (unknown | null)[] = [];

    for (let i = 0; i < 3; i++) {
      const operation = createMockOperation(`ConcurrentQuery${i}`);
      const forward = createSlowForward(5000);

      timeoutLink.request(operation, forward as any).subscribe({
        error: (err) => {
          errors.push(err);
        },
      });
    }

    expect(errors).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    expect(errors).toHaveLength(3);
    errors.forEach((err) => {
      expect(err).toBeDefined();
      expect((err as Error).message).toContain('timeout');
    });
  });

  it('should clear timeout on subscriber completion', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const operation = createMockOperation('CompletionQuery');
    const forward = createFastForward();

    timeoutLink.request(operation, forward as any).subscribe({
      next: () => {},
      complete: () => {},
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle timeout with error response', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const operation = createMockOperation('ErrorQuery');
    const forward = createSlowForward(5000, true);

    let receivedError: unknown = null;

    timeoutLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    vi.advanceTimersByTime(1000);
    expect(receivedError).toBeDefined();
    expect((receivedError as Error).message).toContain('timeout');
  });

  it('should include operation name in timeout error', () => {
    const timeoutLink = new TimeoutLink({ timeout: 1000 });
    const operation = createMockOperation('MyTestOperation');
    const forward = createSlowForward(5000);

    let receivedError: unknown = null;

    timeoutLink.request(operation, forward as any).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    vi.advanceTimersByTime(1000);
    expect((receivedError as Error).message).toContain('MyTestOperation');
  });
});
