'use client';

import type { ReactElement } from 'react';
import React from 'react';
import { getStatusBgColor, getStatusColor, STATUS_LABELS } from '../lib/dashboard-utils';
import type { ActivityEntry } from '../lib/dashboard-utils';
import type { BuildStatus } from '../lib/generated/graphql';

/**
 * Inline status badge for activity timeline
 */
function StatusBadgeInline({
  status,
  label,
}: {
  status: BuildStatus;
  label: string;
}): ReactElement {
  const colorClass = getStatusColor(status);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

/**
 * Props for ActivityTimeline component
 */
export interface ActivityTimelineProps {
  /** Array of activity entries to display */
  entries: ActivityEntry[];
  /** Optional loading state */
  isLoading?: boolean;
  /** Maximum number of items to display (default: 10) */
  maxItems?: number;
  /** Optional custom CSS class */
  className?: string;
}

/**
 * ActivityTimeline Component
 *
 * Displays a vertical timeline of recent build activities with status indicators.
 * Shows build names, statuses with color coding, and relative timestamps.
 *
 * Features:
 * - Vertical timeline layout with visual connectors
 * - Status badges with semantic color coding
 * - Relative timestamps ("2 hours ago")
 * - Loading skeleton state
 * - Empty state message
 * - Responsive design
 * - Accessibility: semantic HTML, ARIA labels
 * - Memoized to prevent unnecessary re-renders
 *
 * @example
 * <ActivityTimeline
 *   entries={recentActivity}
 *   maxItems={10}
 * />
 *
 * @example
 * <ActivityTimeline
 *   entries={activities}
 *   isLoading={true}
 * />
 */
function ActivityTimelineComponent({
  entries,
  isLoading = false,
  maxItems = 10,
  className = '',
}: ActivityTimelineProps): ReactElement {
  const displayEntries = entries.slice(0, maxItems);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} role="log" aria-label="Recent build activity" aria-busy={true}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex gap-4 animate-pulse">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (displayEntries.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p className="text-sm font-medium">No recent activity</p>
        <p className="text-xs text-gray-400 mt-1">Builds will appear here as they are created or updated</p>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`} role="log" aria-label="Recent build activity">
      {displayEntries.map((entry, index) => {
        const isLast = index === displayEntries.length - 1;
        const statusColor = getStatusBgColor(entry.status);
        const statusLabel = STATUS_LABELS[entry.status];

        return (
          <div key={entry.id} className="flex gap-4 py-3 relative">
            {/* Timeline vertical line */}
            {!isLast && (
              <div className="absolute left-5 top-12 w-0.5 h-8 bg-gray-200" />
            )}

            {/* Status circle */}
            <div className="flex-shrink-0 mt-1">
              <div
                className={`w-10 h-10 rounded-full ${statusColor} flex items-center justify-center text-white text-xs font-semibold`}
                title={statusLabel}
              >
                {statusLabel.charAt(0)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              {/* Build name with truncation */}
              <p className="text-sm font-medium text-gray-900 truncate">
                {entry.buildName}
              </p>

              {/* Status and timestamp */}
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadgeInline status={entry.status} label={statusLabel} />
                <span className="text-xs text-gray-500">{entry.relativeTime}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Memoized ActivityTimeline to prevent unnecessary re-renders
 * when parent component updates but entries haven't changed.
 */
export const ActivityTimeline = React.memo(ActivityTimelineComponent);
