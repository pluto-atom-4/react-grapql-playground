'use client';

import type { ReactElement } from 'react';
import { ActivityFeed } from './ActivityFeed';
import { useActivityFeed } from '../lib/hooks/useActivityFeed';

/**
 * Props for BuildHistoryTab
 */
export interface BuildHistoryTabProps {
  buildId: string;
  isLoading?: boolean;
}

/**
 * BuildHistoryTab Component
 *
 * Displays activity feed (from Issue #259) for the build
 * Shows status changes, test runs, and other events
 *
 * Note: This component uses useActivityFeed hook internally
 * Future enhancement: Accept events as props from parent component
 */
export function BuildHistoryTab({
  buildId,
  isLoading: externalLoading = false,
}: BuildHistoryTabProps): ReactElement {
  const { events, loading: feedLoading } = useActivityFeed(buildId);
  const isLoading = externalLoading || feedLoading;

  return (
    <ActivityFeed
      buildId={buildId}
      events={events}
      isLoading={isLoading}
      pageSize={10}
    />
  );
}

