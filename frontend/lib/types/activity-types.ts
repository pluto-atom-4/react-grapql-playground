/**
 * Shared type definitions for Activity Feed and Status History components/hooks
 * Prevents circular imports between hooks and components
 */

import type { BuildStatus } from '../generated/graphql';

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
 * Status history item
 */
export interface StatusHistoryItem {
  status: BuildStatus;
  timestamp: Date;
  duration?: number;
}
