'use client';

import type { ReactElement } from 'react';
import React from 'react';
import type { BuildStatus } from '../lib/generated/graphql';
import { STATUS_LABELS, STATUS_NODE_COLORS, formatDuration, formatRelativeTime } from '../lib/status-utils';

/**
 * Status history item
 */
export interface StatusHistoryItem {
  status: BuildStatus;
  timestamp: Date;
  duration?: number;
}

/**
 * Props for StatusProgression component
 */
export interface StatusProgressionProps {
  /** Build ID (for tracking) */
  buildId: string;
  /** Array of status history items */
  statuses: StatusHistoryItem[];
  /** Whether status nodes are clickable */
  interactive?: boolean;
  /** Size variant for responsive design */
  size?: 'small' | 'medium' | 'large';
  /** Optional callback when a status node is clicked */
  onStatusClick?: (status: StatusHistoryItem, index: number) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * StatusProgression Component
 *
 * Displays a horizontal flowchart showing build status progression.
 * Shows each status with timestamps and duration in that status.
 *
 * Features:
 * - Horizontal flow diagram on desktop
 * - Vertical stacking on mobile
 * - Status nodes with color coding
 * - Arrows connecting nodes
 * - Hover tooltips with duration
 * - Responsive layout
 * - Accessibility (role="figure", ARIA labels)
 * - Keyboard navigation
 *
 * @example
 * <StatusProgression
 *   buildId="build-123"
 *   statuses={[
 *     { status: 'PENDING', timestamp: new Date(...) },
 *     { status: 'RUNNING', timestamp: new Date(...) },
 *     { status: 'COMPLETE', timestamp: new Date(...) },
 *   ]}
 *   size="medium"
 * />
 */
export function StatusProgression({
  buildId,
  statuses,
  interactive = false,
  size = 'medium',
  onStatusClick,
  className = '',
}: StatusProgressionProps): ReactElement {
  if (statuses.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <p className="text-sm">No status history available</p>
      </div>
    );
  }

  // Calculate node sizes based on size variant
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-base',
  };

  const nodeSize = sizeClasses[size];

  return (
    <div
      className={`w-full ${className}`}
      role="figure"
      aria-label={`Build ${buildId} status progression: ${statuses
        .map((s) => STATUS_LABELS[s.status])
        .join(' → ')}`}
    >
      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex gap-2 md:gap-4 items-center overflow-x-auto pb-4">
        {statuses.map((item, index) => (
          <React.Fragment key={`${buildId}-status-${index}`}>
            {/* Status node */}
            <StatusNode
              status={item.status}
              timestamp={item.timestamp}
              duration={item.duration}
              interactive={interactive}
              size={size}
              nodeSize={nodeSize}
              onClick={() => onStatusClick?.(item, index)}
            />

            {/* Arrow connector (not after last item) */}
            {index < statuses.length - 1 && (
              <div
                className="flex-shrink-0 text-gray-400 font-bold text-lg md:text-xl"
                aria-hidden="true"
              >
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile: Vertical layout */}
      <div className="sm:hidden space-y-3">
        {statuses.map((item, index) => (
          <div key={`${buildId}-status-mobile-${index}`} className="flex items-center gap-3">
            {/* Status node */}
            <StatusNode
              status={item.status}
              timestamp={item.timestamp}
              duration={item.duration}
              interactive={interactive}
              size="small"
              nodeSize={sizeClasses.small}
              onClick={() => onStatusClick?.(item, index)}
            />

            {/* Vertical connector (not after last item) */}
            {index < statuses.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-300" aria-hidden="true" />
            )}

            {/* Status info */}
            <div className="text-sm">
              <p className="font-medium text-gray-900">{STATUS_LABELS[item.status]}</p>
              <p className="text-xs text-gray-500">
                {formatRelativeTime(item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Individual status node component
 */
interface StatusNodeProps {
  status: BuildStatus;
  timestamp: Date;
  duration?: number;
  interactive?: boolean;
  size?: 'small' | 'medium' | 'large';
  nodeSize: string;
  onClick?: () => void;
}

function StatusNode({
  status,
  timestamp,
  duration,
  interactive,
  size,
  nodeSize,
  onClick,
}: StatusNodeProps): ReactElement {
  const bgColor = STATUS_NODE_COLORS[status];
  const label = STATUS_LABELS[status];
  const formattedDate = timestamp instanceof Date ? timestamp.toLocaleString() : new Date(timestamp).toLocaleString();

  const tooltipText = duration
    ? `${label}\n${formatRelativeTime(timestamp instanceof Date ? timestamp : new Date(timestamp))}\nDuration: ${formatDuration(duration)}`
    : `${label}\n${formattedDate}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-white transition-all
        ${nodeSize}
        ${bgColor}
        ${interactive ? 'cursor-pointer hover:shadow-lg hover:scale-110' : 'cursor-default'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
      title={tooltipText}
      aria-label={`Status: ${label}`}
      aria-describedby={`status-tooltip-${status}`}
    >
      {size === 'small' ? label.charAt(0) : label.substring(0, 2).toUpperCase()}
    </button>
  );
}
