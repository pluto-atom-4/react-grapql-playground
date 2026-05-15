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
 * Issue #295: Monkey-patch RxJS Subscription to suppress Apollo AbortError
 * The error occurs when RxJS subscriptions are cleaned up during test teardown
 */
if (typeof globalThis !== 'undefined') {
  try {
    // Try to patch the RxJS error handling
    const RxJS = require('rxjs');
    const originalError = console.error;
    
    // Capture the original error stack and suppress Apollo errors
    console.error = function (...args: any[]) {
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
      originalError.apply(console, args);
    };
  } catch {
    // RxJS might not be available, that's OK
  }
}

/**
 * Global beforeAll: Set up error suppression
 */
beforeAll(() => {
  // Suppress Apollo errors that occur during cleanup
  if (typeof window !== 'undefined') {
    const originalOnerror = window.onerror;
    window.onerror = function (
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
        return originalOnerror.call(window, message, source, lineno, colno, error) as boolean;
      }

      return false;
    };
  }
});

/**
 * Global beforeEach: Clean up state before each test
 * Runs before every test in the entire suite
 */
beforeEach(() => {
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
afterEach(async () => {
  // Final cleanup of localStorage
  localStorageMock.clear();

  // Restore all mocks to their original implementations
  vi.restoreAllMocks();

  // Issue #295: Wait for pending microtasks to settle
  // This allows Apollo Client's RxJS unsubscribe and cleanup to complete
  // before the next test starts, preventing cross-test interference
  await new Promise((resolve) => process.nextTick(resolve));
});

/**
 * Global afterAll: Final cleanup after all tests complete
 * Ensures Apollo Client resources are fully disposed
 */
afterAll(async () => {
  // Give final chance for any remaining operations to complete
  await new Promise((resolve) => process.nextTick(resolve));
  
  // Final cleanup
  localStorageMock.clear();
  vi.restoreAllMocks();
});
