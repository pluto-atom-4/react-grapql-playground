'use client';

import type { ReactElement } from 'react';
import React, { useState } from 'react';
import type { BuildStatus } from '../lib/generated/graphql';
import { formatRelativeTime } from '../lib/status-utils';
import { StatusBadge } from './StatusBadge';

/**
 * Build event type
 */
export type BuildEventType = 'status_change' | 'test_run' | 'manual_update' | 'system_event';

/**
 * Build event structure
 */
export interface BuildEvent {
  id: string;
  buildId: string;
  eventType: BuildEventType;
  timestamp: Date;
  description: string;
  metadata?: {
    previousStatus?: BuildStatus;
    newStatus?: BuildStatus;
    reason?: string;
    changedBy?: string;
    testRunId?: string;
    testResult?: 'PASSED' | 'FAILED';
    [key: string]: unknown;
  };
}

/**
 * Props for TimelineEvent component
 */
export interface TimelineEventProps {
  /** Event data */
  event: BuildEvent;
  /** Whether event details are expanded */
  expanded?: boolean;
  /** Callback when expand button is clicked */
  onExpand?: (eventId: string, expanded: boolean) => void;
  /** Index for visual connector (determines if connector line shows after this event) */
  index?: number;
  /** Total number of events (for connector line logic) */
  totalEvents?: number;
}

/**
 * Get event type icon and label
 */
function getEventTypeInfo(eventType: BuildEventType): { icon: string; label: string } {
  const typeMap: Record<BuildEventType, { icon: string; label: string }> = {
    status_change: { icon: '→', label: 'Status Changed' },
    test_run: { icon: '✓', label: 'Test Run' },
    manual_update: { icon: '✎', label: 'Manual Update' },
    system_event: { icon: '⚙', label: 'System Event' },
  };
  return typeMap[eventType];
}

/**
 * Get event type badge color
 */
function getEventTypeBadgeClass(eventType: BuildEventType): string {
  const typeColors: Record<BuildEventType, string> = {
    status_change: 'bg-purple-100 text-purple-800',
    test_run: 'bg-orange-100 text-orange-800',
    manual_update: 'bg-blue-100 text-blue-800',
    system_event: 'bg-gray-100 text-gray-800',
  };
  return typeColors[eventType];
}

/**
 * TimelineEvent Component
 *
 * Displays an individual event in the activity feed timeline.
 * Shows event type, timestamp, description, and expandable metadata.
 *
 * Features:
 * - Event type icon and badge
 * - Absolute and relative timestamps
 * - Expandable details
 * - Status badge for status change events
 * - Timeline connector line
 * - Responsive design
 * - Accessibility (keyboard navigation, ARIA labels)
 *
 * @example
 * <TimelineEvent
 *   event={statusChangeEvent}
 *   expanded={false}
 *   onExpand={(id, expanded) => handleExpand(id, expanded)}
 *   index={0}
 *   totalEvents={5}
 * />
 */
export function TimelineEvent({
  event,
  expanded = false,
  onExpand,
  index = 0,
  totalEvents = 1,
}: TimelineEventProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const { icon, label } = getEventTypeInfo(event.eventType);
  const badgeClass = getEventTypeBadgeClass(event.eventType);
  const showConnector = index < totalEvents - 1;

  const handleToggleExpand = (): void => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpand?.(event.id, newExpanded);
  };

  const formattedDate = event.timestamp instanceof Date
    ? event.timestamp.toLocaleString()
    : new Date(event.timestamp).toLocaleString();

  const relativeTime = formatRelativeTime(
    event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp),
  );

  return (
    <div className="relative" role="listitem">
      {/* Timeline connector line */}
      {showConnector && (
        <div
          className="absolute left-5 top-20 w-0.5 h-12 bg-gray-200"
          aria-hidden="true"
        />
      )}

      {/* Main event container */}
      <div className="flex gap-4 py-4">
        {/* Event icon */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-600"
            role="img"
            aria-label={label}
            title={label}
          >
            {icon}
          </div>
        </div>

        {/* Event content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Header with badge and time */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
              {label}
            </span>
            <time
              className="text-xs text-gray-500"
              dateTime={event.timestamp instanceof Date
                ? event.timestamp.toISOString()
                : new Date(event.timestamp).toISOString()}
              title={formattedDate}
            >
              {relativeTime}
            </time>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-900 mt-1">{event.description}</p>

          {/* Status badge for status change events */}
          {event.eventType === 'status_change' && event.metadata?.newStatus && (
            <div className="mt-2">
              <StatusBadge status={event.metadata.newStatus} />
            </div>
          )}

          {/* Expand button (if has metadata) */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              aria-expanded={isExpanded}
              aria-controls={`event-details-${event.id}`}
            >
              {isExpanded ? '▼ Hide details' : '▶ Show details'}
            </button>
          )}

          {/* Expandable details */}
          {isExpanded && event.metadata && (
            <div
              id={`event-details-${event.id}`}
              className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 space-y-2"
            >
              {event.metadata.previousStatus && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">From:</span>
                  <span className="text-gray-900 font-medium">{event.metadata.previousStatus}</span>
                </div>
              )}
              {event.metadata.reason && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Reason:</span>
                  <span className="text-gray-900 font-medium">{event.metadata.reason}</span>
                </div>
              )}
              {event.metadata.changedBy && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Changed by:</span>
                  <span className="text-gray-900 font-medium">{event.metadata.changedBy}</span>
                </div>
              )}
              {event.metadata.testRunId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Test Run ID:</span>
                  <span className="text-gray-900 font-mono text-xs">{event.metadata.testRunId}</span>
                </div>
              )}
              {event.metadata.testResult && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Result:</span>
                  <span className={`font-medium ${
                    event.metadata.testResult === 'PASSED'
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {event.metadata.testResult}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
