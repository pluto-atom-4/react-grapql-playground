/**
 * useTestRuns Hook - Smart Polling for Test Runs
 *
 * Fetches test runs for a build and provides smart polling capability.
 * Automatically stops polling when all tests reach terminal state (PASSED/FAILED).
 *
 * @example
 * const { testRuns, loading, error, startPolling, stopPolling, isPolling } = useTestRuns(buildId);
 *
 * useEffect(() => {
 *   startPolling(2000); // Start polling every 2 seconds
 *   return () => stopPolling(); // Cleanup on unmount
 * }, [startPolling, stopPolling]);
 */

'use client';

import { useQuery } from '@apollo/client/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TEST_RUNS_QUERY } from '../graphql-queries';
import type { TestRun, TestStatus, GetTestRunsQuery, GetTestRunsQueryVariables } from '../generated/graphql';
import { TestStatus as TestStatusEnum } from '../generated/graphql';

/**
 * Options for configuring useTestRuns behavior
 */
export interface UseTestRunsOptions {
  /** Auto-start polling if tests are running (default: false) */
  autoStart?: boolean;
  /** Poll interval in milliseconds (default: 2000) */
  pollInterval?: number;
}

/**
 * Return type of the useTestRuns hook
 */
export interface UseTestRunsResult {
  /** Array of test runs for the build */
  testRuns: TestRun[];
  /** Loading state during initial fetch */
  loading: boolean;
  /** Error state if query fails */
  error: Error | null;
  /** Start polling for test run updates */
  startPolling: (interval?: number) => void;
  /** Stop polling immediately */
  stopPolling: () => void;
  /** Manual refetch of test runs */
  refetch: () => Promise<{ data: { testRuns: TestRun[] } }>;
  /** Current polling status */
  isPolling: boolean;
  /** Current poll interval in milliseconds */
  pollInterval: number;
}

/**
 * Type for polling state management
 */
interface PollingState {
  isPolling: boolean;
  pollInterval: number;
  pollTimer: ReturnType<typeof setInterval> | null;
}

/**
 * Determines if a test status is terminal (test execution complete)
 */
function isTerminalState(status: TestStatus): boolean {
  return status === TestStatusEnum.Passed || status === TestStatusEnum.Failed;
}

/**
 * Checks if all test runs have reached terminal state
 */
function allTestsTerminal(testRuns: TestRun[]): boolean {
  return testRuns.length > 0 && testRuns.every(tr => isTerminalState(tr.status));
}

/**
 * Custom hook for fetching test runs with smart polling capability.
 *
 * Features:
 * - Fetches test runs from GraphQL using Apollo Client
 * - Manual polling control (startPolling/stopPolling functions)
 * - Smart polling: Auto-stops when all tests reach terminal state
 * - Automatic cleanup on unmount (prevents memory leaks)
 * - Error handling and loading states
 * - Full Apollo Client cache integration
 *
 * @param buildId - ID of the build to fetch test runs for
 * @param options - Configuration options for the hook
 * @returns Hook result with test runs, loading/error states, and polling controls
 */
export function useTestRuns(
  buildId: string,
  options?: UseTestRunsOptions,
): UseTestRunsResult {
  const defaultPollInterval = options?.pollInterval ?? 2000;

  // Apollo useQuery for initial data fetch
  const { data, loading, error, refetch: apolloRefetch } = useQuery<
    GetTestRunsQuery,
    GetTestRunsQueryVariables
  >(TEST_RUNS_QUERY, {
    variables: { buildId },
    errorPolicy: 'all', // Continue polling even if error occurs
  });

  const testRuns = (data?.testRuns as TestRun[]) ?? [];

  // Polling state management
  const [pollingState, setPollingState] = useState<PollingState>({
    isPolling: false,
    pollInterval: defaultPollInterval,
    pollTimer: null,
  });

  // Keep a ref to the current polling timer for synchronous cleanup
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Wraps Apollo's refetch with type safety
   */
  const refetch = useCallback(
    async (): Promise<{ data: { testRuns: TestRun[] } }> => {
      if (!apolloRefetch) {
        return { data: { testRuns: [] } };
      }
      const result = await apolloRefetch();
      return {
        data: {
          testRuns: (result?.data?.testRuns as TestRun[]) ?? [],
        },
      };
    },
    [apolloRefetch],
  );

  /**
   * Starts polling for test run updates at specified interval.
   * Prevents duplicate intervals from rapid startPolling calls.
   */
  const startPolling = useCallback(
    (interval?: number) => {
      const pollInterval = interval ?? defaultPollInterval;

      // Clear existing timer if already polling
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
      }

      // Create new interval for polling
      const newTimer = setInterval(() => {
        if (isMountedRef.current) {
          // Call refetch and handle the promise
          void refetch()
            .then(result => {
              if (isMountedRef.current) {
                const refetchedTestRuns = result?.data?.testRuns;
                if (Array.isArray(refetchedTestRuns)) {
                  // Check if all tests have reached terminal state
                  if (allTestsTerminal(refetchedTestRuns)) {
                    // Auto-stop polling when all tests complete
                    if (pollTimerRef.current !== null) {
                      clearInterval(pollTimerRef.current);
                      pollTimerRef.current = null;
                    }
                    if (isMountedRef.current) {
                      setPollingState(state => ({
                        ...state,
                        isPolling: false,
                        pollTimer: null,
                      }));
                    }
                  }
                }
              }
            })
            .catch((err: unknown) => {
              // Log error but continue polling (graceful error recovery)
              if (err instanceof Error) {
                console.warn('Error during polling refetch:', err.message);
              } else {
                console.warn('Error during polling refetch:', err);
              }
            });
        }
      }, pollInterval);

      pollTimerRef.current = newTimer;

      if (isMountedRef.current) {
        setPollingState({
          isPolling: true,
          pollInterval,
          pollTimer: newTimer,
        });
      }
    },
    [defaultPollInterval, refetch],
  );

  /**
   * Stops polling immediately and clears the interval.
   * Safe to call even if polling is not active.
   */
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (isMountedRef.current) {
      setPollingState(prevState => ({
        ...prevState,
        isPolling: false,
        pollTimer: null,
      }));
    }
  }, []);

  /**
   * Cleanup on component unmount: stop polling and clear intervals
   */
  useEffect((): (() => void) => {
    return () => {
      isMountedRef.current = false;

      // Synchronously clear any remaining timer
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  return {
    testRuns,
    loading,
    error: error ?? null,
    startPolling,
    stopPolling,
    refetch,
    isPolling: pollingState.isPolling,
    pollInterval: pollingState.pollInterval,
  };
}
