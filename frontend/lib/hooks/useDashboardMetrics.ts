/**
 * useDashboardMetrics Hook
 *
 * Fetches builds and calculates dashboard metrics including:
 * - Total builds, in progress, completed, failed counts
 * - Completion rate percentage
 * - Status distribution for visualization
 * - Recent activity timeline
 *
 * Automatically updates when underlying builds query updates
 * (e.g., after mutations that modify builds).
 *
 * @example
 * const { metrics, statusDistribution, recentActivity, isLoading, error, refetch } = useDashboardMetrics();
 *
 * @returns Hook result with metrics, activities, loading/error states, and refetch function
 */

'use client';

import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { DASHBOARD_METRICS_QUERY } from '../graphql-queries';
import type {
  GetDashboardMetricsQuery,
  GetDashboardMetricsQueryVariables,
} from '../generated/graphql';
import {
  calculateMetrics,
  calculateStatusDistribution,
  getRecentActivity,
  type DashboardMetrics,
  type StatusDistribution,
  type ActivityEntry,
  type BuildData,
} from '../dashboard-utils';

/**
 * Return type of the useDashboardMetrics hook
 */
export interface UseDashboardMetricsReturn {
  /** Aggregated metrics (total, inProgress, completed, failed, completionRate) */
  metrics: DashboardMetrics;
  /** Status distribution for pie chart or visualization */
  statusDistribution: StatusDistribution[];
  /** Recent activity timeline entries (sorted by updated time) */
  recentActivity: ActivityEntry[];
  /** Loading state during initial fetch */
  isLoading: boolean;
  /** Error state if query fails */
  error: Error | null;
  /** Manual refetch of metrics */
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and calculating dashboard metrics.
 *
 * Features:
 * - Fetches all builds from GraphQL using Apollo Client
 * - Calculates aggregated metrics on builds data
 * - Memoizes calculations to prevent unnecessary recalculations
 * - Automatically updates when Apollo cache changes (after mutations)
 * - Provides recent activity with relative timestamps
 * - Full error handling and loading states
 *
 * @param limit - Maximum number of builds to fetch (default: 50, max: 100)
 * @returns Hook result with metrics, activities, and loading states
 *
 * @note Backend validation enforces limit in range [1, 100]. Default limit of 50 provides:
 * - Sufficient data for aggregate calculations
 * - Respects backend constraints
 * - Maintains good performance (small payload)
 * - Leaves room for future tuning (not at maximum)
 */
export function useDashboardMetrics(limit: number = 50): UseDashboardMetricsReturn {
  // Fetch builds data from GraphQL
  const { data, loading, error, refetch: apolloRefetch } = useQuery<
    GetDashboardMetricsQuery,
    GetDashboardMetricsQueryVariables
  >(DASHBOARD_METRICS_QUERY, {
    variables: {
      limit,
      offset: 0,
    },
    errorPolicy: 'all',
  });

  // Extract builds from GraphQL response, with fallback to empty array
  const builds = useMemo(() => {
    if (!data?.builds?.items) return [];
    return data.builds.items as BuildData[];
  }, [data]);

  // Memoize metrics calculation to prevent unnecessary recalculations
  const metrics = useMemo(() => calculateMetrics(builds), [builds]);

  // Memoize status distribution calculation
  const statusDistribution = useMemo(
    () => calculateStatusDistribution(builds),
    [builds],
  );

  // Memoize recent activity calculation
  const recentActivity = useMemo(
    () => getRecentActivity(builds, 10),
    [builds],
  );

  // Wrap Apollo's refetch with error handling
  const refetch = async (): Promise<void> => {
    try {
      await apolloRefetch();
    } catch (err) {
      console.error('Error refetching dashboard metrics:', err);
      throw err;
    }
  };

  return {
    metrics,
    statusDistribution,
    recentActivity,
    isLoading: loading,
    error: error ?? null,
    refetch,
  };
}
