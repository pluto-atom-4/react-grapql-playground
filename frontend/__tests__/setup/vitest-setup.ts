/**
 * Global Vitest setup for test isolation and cleanup
 * This file is executed once before all tests run (defined in vitest.config.ts)
 *
 * Responsibilities:
 * - Initialize localStorage mock for all tests
 * - Set up global beforeEach/afterEach hooks for cleanup
 * - Clear state before and after each test to prevent cross-test pollution
 * - Ensure tests can run in parallel without state leakage
 */

import { beforeEach, afterEach, vi } from 'vitest';
import { initializeLocalStorageMock, localStorageMock } from './localStorage-mock';

// Initialize localStorage mock before any tests run
initializeLocalStorageMock();

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
 */
afterEach(() => {
  // Final cleanup of localStorage
  localStorageMock.clear();

  // Restore all mocks to their original implementations
  vi.restoreAllMocks();
});
