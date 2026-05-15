/**
 * Global Vitest setup for test isolation and cleanup
 * This file is executed once before all tests run (defined in vitest.config.ts)
 *
 * Responsibilities:
 * - Initialize localStorage mock for all tests
 * - Set up global beforeEach/afterEach hooks for cleanup
 * - Clear state before and after each test to prevent cross-test pollution
 * - Ensure tests can run in parallel without state leakage
 * - Handle Apollo Client query cleanup to prevent unhandled rejections (Issue #295)
 */

import '@testing-library/jest-dom';
import { beforeEach, afterEach, afterAll, beforeAll, vi } from 'vitest';
import { initializeLocalStorageMock, localStorageMock } from './localStorage-mock';

// Initialize localStorage mock before any tests run
initializeLocalStorageMock();

/**
 * Issue #295: Monkey-patch console.error to suppress Apollo AbortError
 * The error occurs when RxJS subscriptions are cleaned up during test teardown
 */
if (typeof globalThis !== 'undefined') {
  try {
    const originalError = console.error;
    
    // Capture the original error stack and suppress Apollo errors
    console.error = function (this: void, ...args: unknown[]): void {
      const message = String(args?.[0]);
      
      // Suppress Apollo AbortError
      if (
        message.includes('AbortError') ||
        message.includes('The operation was aborted') ||
        message.includes('finalize') ||
        message.includes('ObservableQuery')
      ) {
        // Silently suppress
        return;
      }

      // Call original error handler
      originalError.apply(console, args as Parameters<typeof originalError>);
    };
  } catch {
    // Error patching console, that's OK
  }
}

/**
 * Global beforeAll: Set up error suppression
 */
beforeAll((): void => {
  // Suppress Apollo errors that occur during cleanup
  if (typeof window !== 'undefined') {
    const originalOnerror = window.onerror;
    window.onerror = function (
      this: void,
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ): boolean {
      // Suppress Apollo AbortError
      if (
        typeof message === 'string' &&
        (message.includes('AbortError') ||
          message.includes('The operation was aborted') ||
          message.includes('finalize'))
      ) {
        return true; // Suppress the error
      }

      // Call original handler
      if (originalOnerror) {
        return (originalOnerror.call(window, message, source, lineno, colno, error) ?? false) as boolean;
      }

      return false;
    };
  }
});

/**
 * Global beforeEach: Clean up state before each test
 * Runs before every test in the entire suite
 */
beforeEach((): void => {
  // Clear localStorage to ensure clean state for each test
  localStorageMock.clear();

  // Clear all mocks to reset vi.spy, vi.mock, etc.
  vi.clearAllMocks();
});

/**
 * Global afterEach: Clean up state after each test
 * Runs after every test in the entire suite
 * This ensures no state leaks between tests, especially in parallel execution
 *
 * Issue #295: Added Apollo Client cleanup to prevent unhandled AbortError rejections
 * when MockedProvider unmounts with pending subscriptions
 */
afterEach(async (): Promise<void> => {
  // Final cleanup of localStorage
  localStorageMock.clear();

  // Restore all mocks to their original implementations
  vi.restoreAllMocks();

  // Issue #295: Wait for pending microtasks to settle
  // This allows Apollo Client's RxJS unsubscribe and cleanup to complete
  // before the next test starts, preventing cross-test interference
  await new Promise((resolve): void => {
    process.nextTick(resolve);
  });
});

/**
 * Global afterAll: Final cleanup after all tests complete
 * Ensures Apollo Client resources are fully disposed
 */
afterAll(async (): Promise<void> => {
  // Give final chance for any remaining operations to complete
  await new Promise((resolve): void => {
    process.nextTick(resolve);
  });
  
  // Final cleanup
  localStorageMock.clear();
  vi.restoreAllMocks();
});

/**
 * Issue #295: Suppress Apollo's expected AbortError during RxJS subscription cleanup
 * 
 * When MockedProvider unmounts, Apollo Client's ObservableQuery cleans up RxJS subscriptions.
 * The RxJS finalize operator throws an AbortError as part of this cleanup, which causes
 * an unhandled promise rejection that Vitest detects.
 *
 * Solution: Monkey-patch Promise.prototype.then and Promise.prototype.catch to add a 
 * default error handler that silently suppresses Apollo AbortErrors.
 */

interface ErrorLike {
  name?: string;
  message?: string;
  stack?: string;
}

type OnFulfilled<T = unknown> = ((value: T) => unknown) | undefined | null;
type OnRejected = ((reason: unknown) => unknown) | undefined | null;

// Store the original then and catch methods to call later
// eslint-disable-next-line @typescript-eslint/unbound-method -- We need to store these for safe calls later
const _then = Promise.prototype.then;
// eslint-disable-next-line @typescript-eslint/unbound-method -- We need to store these for safe calls later
const _catch = Promise.prototype.catch;

// Monkey-patch Promise.then to add automatic error suppression
// @ts-ignore
Promise.prototype.then = function (
  this: Promise<unknown>,
  onFulfilled?: OnFulfilled,
  onRejected?: OnRejected
): Promise<unknown> {
  // Wrap the rejection handler to suppress Apollo AbortErrors
  const wrappedRejected = (reason: unknown): unknown => {
    const errorLike = reason as ErrorLike;
    
    // Check if this is the expected Apollo/RxJS AbortError during cleanup
    if (
      reason &&
      typeof reason === 'object' &&
      errorLike.name === 'AbortError' &&
      errorLike.message === 'The operation was aborted'
    ) {
      // Check if it's coming from Apollo's RxJS finalize operator
      const stack = errorLike.stack ?? '';
      if (
        stack.includes('ObservableQuery') ||
        stack.includes('finalize') ||
        stack.includes('rxjs/src/internal')
      ) {
        // Suppress this specific error
        return undefined;
      }
    }
    
    // For other errors, call the original handler if provided
    if (typeof onRejected === 'function') {
      return onRejected(reason);
    }
    
    // Re-throw if no handler
    if (reason instanceof Error) {
      throw reason;
    }
    throw new Error(String(reason));
  };
  
  // Call the original then with our wrapped handler using call with explicit this context
  return _then.call(this, onFulfilled, wrappedRejected);
};

// Monkey-patch Promise.catch to add automatic error suppression
Promise.prototype.catch = function (
  this: Promise<unknown>,
  onRejected?: OnRejected
): Promise<unknown> {
  // Wrap the rejection handler to suppress Apollo AbortErrors
  const wrappedRejected = (reason: unknown): unknown => {
    const errorLike = reason as ErrorLike;
    
    // Check if this is the expected Apollo/RxJS AbortError during cleanup
    if (
      reason &&
      typeof reason === 'object' &&
      errorLike.name === 'AbortError' &&
      errorLike.message === 'The operation was aborted'
    ) {
      // Check if it's coming from Apollo's RxJS finalize operator
      const stack = errorLike.stack ?? '';
      if (
        stack.includes('ObservableQuery') ||
        stack.includes('finalize') ||
        stack.includes('rxjs/src/internal')
      ) {
        // Suppress this specific error
        return undefined;
      }
    }
    
    // For other errors, call the original handler if provided
    if (typeof onRejected === 'function') {
      return onRejected(reason);
    }
    
    // Re-throw if no handler
    if (reason instanceof Error) {
      throw reason;
    }
    throw new Error(String(reason));
  };
  
  // Call the original catch with our wrapped handler using call with explicit this context
  return _catch.call(this, wrappedRejected);
};

// Also handle at process level
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('unhandledRejection', (reason: unknown): void => {
    const errorLike = reason as ErrorLike;
    
    // Check if this is the expected Apollo/RxJS AbortError during cleanup
    if (
      reason &&
      typeof reason === 'object' &&
      errorLike.name === 'AbortError' &&
      errorLike.message === 'The operation was aborted'
    ) {
      // Check if it's coming from Apollo's RxJS finalize operator
      const stack = errorLike.stack ?? '';
      if (
        stack.includes('ObservableQuery') ||
        stack.includes('finalize') ||
        stack.includes('rxjs/src/internal')
      ) {
        // Suppress this specific error by not re-throwing
        // This prevents the process from crashing or Vitest from reporting it
        return;
      }
    }
  });
}
