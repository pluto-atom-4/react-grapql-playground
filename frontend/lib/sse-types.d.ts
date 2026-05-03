/**
 * Type declarations for SSE debug and metrics globals
 * Exposed via window.__SSE_DEBUG and window.__SSE_METRICS for frontend debugging
 */

export interface SSEMetrics {
  /** Total events received from SSE stream */
  totalEventsReceived: number;

  /** Events skipped due to deduplication (same eventId) */
  totalDuplicates: number;

  /** Successful Apollo cache updates */
  totalCacheUpdates: number;

  /** Failed cache update attempts */
  totalCacheUpdateErrors: number;

  /** Number of reconnection attempts made */
  reconnectAttempts: number;

  /** Average latency for cache update operations (ms) */
  averageLatencyMs: number;

  /** Per-event-type counters for debugging */
  eventTypeCounters: Record<string, number>;

  /** Timestamp of last event received */
  lastEventTime?: number;
}

import type { SSEErrorLog } from './sse-error-handler';

declare global {
  interface Window {
    /**
     * Debug flag for SSE event processing
     * Set via NEXT_PUBLIC_SSE_DEBUG environment variable
     * When true, console.log calls are enabled for SSE event processing
     */
    __SSE_DEBUG?: boolean;

    /**
     * Metrics collection object for SSE event stream
     * Available at window.__SSE_METRICS for performance monitoring
     * Updated in real-time as events are processed
     */
    __SSE_METRICS?: SSEMetrics;

    /**
     * Error log history for SSE connection issues
     * Available at window.__SSE_ERROR_LOGS for debugging connection problems
     * Contains up to 100 most recent errors
     */
    __SSE_ERROR_LOGS?: SSEErrorLog[];
  }
}

export {};
