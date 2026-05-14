/**
 * useActivityFeed Hook
 * Manages activity feed data fetching and state for a build
 */

import { useEffect, useState, useCallback } from 'react';
import { BuildStatus } from '../generated/graphql';
import type { BuildEvent } from '../types/activity-types';

interface UseActivityFeedReturn {
  events: BuildEvent[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch activity feed events for a build
 * Currently simulates data; in production, would call GraphQL API
 */
export function useActivityFeed(buildId: string): UseActivityFeedReturn {
  const [events, setEvents] = useState<BuildEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivityFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call - in production, call GraphQL BUILD_EVENTS_QUERY
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock activity feed events
      const now = new Date();
      const mockEvents: BuildEvent[] = [
        {
          id: 'event-1',
          buildId,
          eventType: 'status_change',
          timestamp: new Date(now.getTime() - 900000), // 15 minutes ago
          description: 'Build completed successfully',
          metadata: {
            previousStatus: BuildStatus.Running,
            newStatus: BuildStatus.Complete,
            changedBy: 'system',
          },
        },
        {
          id: 'event-2',
          buildId,
          eventType: 'test_run',
          timestamp: new Date(now.getTime() - 1200000), // 20 minutes ago
          description: 'Test run completed: All 25 tests passed',
          metadata: {
            testRunId: 'test-run-123',
            testResult: 'PASSED',
          },
        },
        {
          id: 'event-3',
          buildId,
          eventType: 'status_change',
          timestamp: new Date(now.getTime() - 1800000), // 30 minutes ago
          description: 'Build started',
          metadata: {
            previousStatus: BuildStatus.Pending,
            newStatus: BuildStatus.Running,
            changedBy: 'system',
          },
        },
        {
          id: 'event-4',
          buildId,
          eventType: 'manual_update',
          timestamp: new Date(now.getTime() - 2700000), // 45 minutes ago
          description: 'Build configuration updated',
          metadata: {
            changedBy: 'user@example.com',
            reason: 'Updated test parameters',
          },
        },
        {
          id: 'event-5',
          buildId,
          eventType: 'status_change',
          timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
          description: 'Build created',
          metadata: {
            newStatus: BuildStatus.Pending,
            changedBy: 'system',
          },
        },
      ];

      setEvents(mockEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activity feed'));
    } finally {
      setLoading(false);
    }
  }, [buildId]);

  useEffect(() => {
    void fetchActivityFeed();
  }, [fetchActivityFeed]);

  return {
    events,
    loading,
    error,
    refetch: fetchActivityFeed,
  };
}
