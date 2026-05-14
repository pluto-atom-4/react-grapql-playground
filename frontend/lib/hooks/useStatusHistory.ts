/**
 * useStatusHistory Hook
 * Manages status history data fetching and pagination for a build
 */

import { useEffect, useState, useCallback } from 'react';
import { BuildStatus } from '../generated/graphql';
import type { StatusHistoryItem } from '../types/activity-types';

interface UseStatusHistoryReturn {
  statuses: StatusHistoryItem[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch status history for a build
 * Currently simulates data; in production, would call GraphQL API
 */
export function useStatusHistory(buildId: string): UseStatusHistoryReturn {
  const [statuses, setStatuses] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatusHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call - in production, call GraphQL BUILD_STATUS_HISTORY_QUERY
      // For now, we'll generate mock data based on build creation pattern
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Mock status history
      const now = new Date();
      const mockStatuses: StatusHistoryItem[] = [
        {
          status: BuildStatus.Pending,
          timestamp: new Date(now.getTime() - 3600000 * 2), // 2 hours ago
          duration: 1800000, // 30 minutes
        },
        {
          status: BuildStatus.Running,
          timestamp: new Date(now.getTime() - 3600000 * 1.5), // 1.5 hours ago
          duration: 1500000, // 25 minutes
        },
        {
          status: BuildStatus.Complete,
          timestamp: new Date(now.getTime() - 900000), // 15 minutes ago
          duration: 0, // current status
        },
      ];

      setStatuses(mockStatuses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch status history'));
    } finally {
      setLoading(false);
    }
  }, [buildId]);

  useEffect(() => {
    void fetchStatusHistory();
  }, [fetchStatusHistory]);

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatusHistory,
  };
}
