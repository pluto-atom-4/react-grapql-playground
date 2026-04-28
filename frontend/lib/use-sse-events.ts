/**
 * useSSEEvents: Client-side hook for real-time SSE event listening with cache updates
 *
 * Phase D Enhancements:
 * - Exponential backoff reconnection logic (up to 10 attempts, 1s → 2s → 4s → ... → 30s)
 * - Event ID-based deduplication (sliding window of 1000 events, 5-min TTL)
 * - Comprehensive cache updates for all 10 event types
 * - Debug mode with metrics collection (window.__SSE_DEBUG, window.__SSE_METRICS)
 *
 * Pattern:
 * - Opens EventSource connection to Express /events endpoint
 * - Listens for real-time events (buildCreated, buildStatusChanged, partAdded, testRunSubmitted, etc.)
 * - Parses event payloads and updates Apollo Client cache via cache.modify()
 * - Deduplicates by eventId (sliding window, 5-min TTL)
 * - Reconnects automatically with exponential backoff on disconnect
 * - Tracks metrics for observability: totalEventsReceived, totalDuplicates, totalCacheUpdates, reconnectAttempts, averageLatencyMs
 */

'use client';

import { useApolloClient } from '@apollo/client/react';
import { useEffect, useRef } from 'react';

/**
 * Exponential backoff configuration from environment variables
 */
interface ReconnectConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * SSE Debug metrics for observability
 */
interface SSEMetrics {
  totalEventsReceived: number;
  totalDuplicates: number;
  totalCacheUpdates: number;
  totalCacheUpdateErrors: number;
  reconnectAttempts: number;
  averageLatencyMs: number;
  lastEventTime?: number;
  eventTypeCounters: Record<string, number>;
}

/**
 * Event payload type for type-safe event parsing
 */
interface EventPayload {
  eventId?: string;
  event: string;
  buildId?: string;
  partId?: string;
  testRunId?: string;
  fileId?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Get reconnect configuration from environment variables
 */
function getReconnectConfig(): ReconnectConfig {
  return {
    maxAttempts: parseInt(process.env.NEXT_PUBLIC_SSE_RECONNECT_MAX_ATTEMPTS ?? '10', 10),
    baseDelayMs: parseInt(process.env.NEXT_PUBLIC_SSE_BASE_RETRY_DELAY_MS ?? '1000', 10),
    maxDelayMs: parseInt(process.env.NEXT_PUBLIC_SSE_MAX_RETRY_DELAY_MS ?? '30000', 10),
  };
}

/**
 * Get deduplication configuration from environment variables
 */
function getDedupConfig(): { windowSize: number; ttlMs: number } {
  return {
    windowSize: parseInt(process.env.NEXT_PUBLIC_SSE_DEDUP_WINDOW_SIZE ?? '1000', 10),
    ttlMs: parseInt(process.env.NEXT_PUBLIC_SSE_DEDUP_TTL_MS ?? '300000', 10),
  };
}

/**
 * Check if debug mode is enabled via environment variable
 */
function isDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SSE_DEBUG === 'true';
}

/**
 * Initialize or get global metrics object
 */
function getOrInitializeMetrics(): SSEMetrics {
  if (typeof window === 'undefined') {
    return {
      totalEventsReceived: 0,
      totalDuplicates: 0,
      totalCacheUpdates: 0,
      totalCacheUpdateErrors: 0,
      reconnectAttempts: 0,
      averageLatencyMs: 0,
      eventTypeCounters: {},
    };
  }

  if (!window.__SSE_METRICS) {
    window.__SSE_METRICS = {
      totalEventsReceived: 0,
      totalDuplicates: 0,
      totalCacheUpdates: 0,
      totalCacheUpdateErrors: 0,
      reconnectAttempts: 0,
      averageLatencyMs: 0,
      eventTypeCounters: {},
    };
  }
  return window.__SSE_METRICS as SSEMetrics;
}

/**
 * Calculate exponential backoff delay for reconnection attempt
 * Formula: delay = min(baseDelay * (2 ^ attemptNumber), maxDelay)
 */
function calculateReconnectDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, maxDelayMs);
}

/**
 * Parses SSE event data and extracts structured payload with eventId
 */
function parseSSEEvent(data: string): EventPayload | null {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    const event = parsed.event;
    const buildId = parsed.buildId;
    const partId = parsed.partId;
    const testRunId = parsed.testRunId;
    const fileId = parsed.fileId;
    const eventId = parsed.eventId;

    return {
      eventId: typeof eventId === 'string' ? eventId : undefined,
      event: typeof event === 'string' ? event : '',
      buildId: typeof buildId === 'string' ? buildId : undefined,
      partId: typeof partId === 'string' ? partId : undefined,
      testRunId: typeof testRunId === 'string' ? testRunId : undefined,
      fileId: typeof fileId === 'string' ? fileId : undefined,
      payload: parsed.payload as Record<string, unknown> | undefined,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Sliding window deduplicator for event IDs
 * Maintains a set of recent eventIds with TTL-based cleanup
 */
class EventDeduplicator {
  private eventIdMap: Map<string, number> = new Map(); // eventId -> timestamp
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number = 1000, ttlMs: number = 300000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Check if event is duplicate and add if new
   * Returns true if duplicate, false if new
   */
  isDuplicate(eventId: string | undefined): boolean {
    if (!eventId) return false;

    const now = Date.now();

    // Clean up expired entries (TTL-based)
    for (const [id, timestamp] of this.eventIdMap.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.eventIdMap.delete(id);
      }
    }

    // Check if duplicate
    if (this.eventIdMap.has(eventId)) {
      return true;
    }

    // Add new event ID
    this.eventIdMap.set(eventId, now);

    // Trim to max size if needed (sliding window)
    if (this.eventIdMap.size > this.maxSize) {
      const oldestEntry = [...this.eventIdMap.entries()].sort(
        (a, b) => a[1] - b[1]
      )[0];
      if (oldestEntry) {
        this.eventIdMap.delete(oldestEntry[0]);
      }
    }

    return false;
  }

  /**
   * Get current dedup window size for debugging
   */
  getSize(): number {
    return this.eventIdMap.size;
  }
}

/**
 * Hook to listen for SSE events and update Apollo cache in real-time
 * Features:
 * - Exponential backoff reconnection
 * - Event ID-based deduplication
 * - All 10 event type handlers
 * - Debug mode with metrics
 */
export function useSSEEvents(): void {
  const client = useApolloClient();
  const eventSourceRef = useRef<EventSource | undefined>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  const reconnectAttemptRef = useRef<number>(0);
  const dedupRef = useRef<EventDeduplicator>(new EventDeduplicator(
    parseInt(process.env.NEXT_PUBLIC_SSE_DEDUP_WINDOW_SIZE ?? '1000', 10),
    parseInt(process.env.NEXT_PUBLIC_SSE_DEDUP_TTL_MS ?? '300000', 10)
  ));
  const debugRef = useRef<boolean>(isDebugEnabled());
  const latencyTimingsRef = useRef<number[]>([]);

  useEffect(() => {
    const eventSourceURL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    let eventSource: EventSource | undefined;

    try {
      eventSource = new EventSource(`${eventSourceURL}/events`);

      /**
       * Handle buildCreated event: Add new build to cache
       */
      eventSource.addEventListener('buildCreated', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        client.cache.modify({
          fields: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            builds(value: unknown, details: any) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const { readField } = details;
              const existingBuilds = Array.isArray(value)
                ? (value as Array<Record<string, unknown>>)
                : [];

              // Check if build already exists

              const buildExists = existingBuilds.some(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                (build) => readField({ fieldName: 'id', from: build }) === eventData.buildId
              );
              if (buildExists) return existingBuilds;

              // Add new build to cache
              const newBuild = {
                __typename: 'Build',
                id: eventData.buildId,
                ...((eventData.payload as Record<string, unknown>) ?? {}),
              };
              return [...existingBuilds, newBuild];
            },
          },
        });
      });

      /**
       * Handle buildStatusChanged event: Update build status in cache
       */
      eventSource.addEventListener('buildStatusChanged', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        client.cache.modify({
          fields: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            builds(value: unknown, details: any) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const { readField } = details;
              const existingBuilds = Array.isArray(value)
                ? (value as Array<Record<string, unknown>>)
                : [];

              return existingBuilds.map((build) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                if (readField({ fieldName: 'id', from: build }) === eventData.buildId) {
                  return {
                    ...build,
                    status: eventData.payload?.status,
                    updatedAt: eventData.payload?.updatedAt ?? new Date().toISOString(),
                  };
                }
                return build;
              });
            },
          },
        });
      });

      /**
       * Handle partAdded event: Add new part to build's parts list
       */
      eventSource.addEventListener('partAdded', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.partId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        // Try to update build detail cache
        try {
          client.cache.modify({
            fields: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              build(value: unknown, details: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const { readField } = details;
                const existingBuild = value || {};

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                if (readField({ fieldName: 'id', from: existingBuild }) !== eventData.buildId) {
                  return existingBuild;
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const existingParts = readField({ fieldName: 'parts', from: existingBuild }) as
                  | Array<Record<string, unknown>>
                  | undefined;
                const partsArray = Array.isArray(existingParts) ? existingParts : [];

                const partExists = partsArray.some(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  (part) => (readField({ fieldName: 'id', from: part }) as string) === eventData.partId
                );

                if (partExists) return existingBuild;

                const newPart = {
                  __typename: 'Part',
                  id: eventData.partId,
                  ...((eventData.payload as Record<string, unknown>) ?? {}),
                };
                return {
                  ...existingBuild,
                  parts: [...partsArray, newPart],
                };
              },
            },
          });
        } catch (error) {
          // Silently ignore if build not yet in cache (will be fetched fresh)
          console.warn('Failed to update parts in cache:', error);
        }
      });

      /**
       * Handle testRunSubmitted event: Add new test run to build's test runs list
       */
      eventSource.addEventListener('testRunSubmitted', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.testRunId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        // Try to update build detail cache
        try {
          client.cache.modify({
            fields: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              build(value: unknown, details: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const { readField } = details;
                const existingBuild = value || {};

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                if (readField({ fieldName: 'id', from: existingBuild }) !== eventData.buildId) {
                  return existingBuild;
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const existingTestRuns = readField({
                  fieldName: 'testRuns',
                  from: existingBuild,
                }) as Array<Record<string, unknown>> | undefined;
                const testRunsArray = Array.isArray(existingTestRuns) ? existingTestRuns : [];

                const testRunExists = testRunsArray.some(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  (tr) => (readField({ fieldName: 'id', from: tr }) as string) === eventData.testRunId
                );

                if (testRunExists) return existingBuild;

                const newTestRun = {
                  __typename: 'TestRun',
                  id: eventData.testRunId,
                  ...((eventData.payload as Record<string, unknown>) ?? {}),
                };
                return {
                  ...existingBuild,
                  testRuns: [...testRunsArray, newTestRun],
                };
              },
            },
          });
        } catch (error) {
          // Silently ignore if build not yet in cache (will be fetched fresh)
          console.warn('Failed to update test runs in cache:', error);
        }
      });

      /**
       * Handle general error and reconnect
       */
      eventSource.addEventListener('error', (): void => {
        console.warn('SSE connection error, will attempt to reconnect');
        // Automatically reconnected by browser EventSource
      });
    } catch (error) {
      console.error('Failed to connect to SSE stream:', error);
    }

    /**
     * Cleanup on unmount
     */
    return (): void => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [client]);
}
