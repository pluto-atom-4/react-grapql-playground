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
import type { SSEMetrics } from './sse-types';

/**
 * Exponential backoff configuration from environment variables
 */
interface ReconnectConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
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

  /**
   * Helper to update metrics counters
   */
  const updateMetrics = (
    key: keyof Omit<SSEMetrics, 'eventTypeCounters'>,
    increment: number = 1
  ): void => {
    const metrics = getOrInitializeMetrics();
    if (key === 'averageLatencyMs') {
      // Special handling for average - will be computed from latency array
      const sum = latencyTimingsRef.current.reduce((a, b) => a + b, 0);
      metrics.averageLatencyMs =
        latencyTimingsRef.current.length > 0 ? sum / latencyTimingsRef.current.length : 0;
    } else {
      metrics[key] = (metrics[key] as number) + increment;
    }
  };

  /**
   * Update event type counter in metrics
   */
  const updateEventTypeCounter = (eventType: string): void => {
    const metrics = getOrInitializeMetrics();
    metrics.eventTypeCounters[eventType] = (metrics.eventTypeCounters[eventType] ?? 0) + 1;
  };

  /**
   * Debug log with conditional output
   */
  const debugLog = (message: string, data?: unknown): void => {
    if (debugRef.current) {
      if (data !== undefined) {
        // eslint-disable-next-line no-console
        console.log(`[SSE Debug] ${message}`, data);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[SSE Debug] ${message}`);
      }
    }
  };

  /**
   * Handle event with timing and metrics
   */
  const handleEventWithMetrics = (eventType: string, handler: () => void): void => {
    const startTime =
      typeof performance !== 'undefined' && 'now' in performance
        ? performance.now()
        : Date.now();
    try {
      handler();
      const endTime =
        typeof performance !== 'undefined' && 'now' in performance
          ? performance.now()
          : Date.now();
      const duration = endTime - startTime;
      latencyTimingsRef.current.push(duration);
      // Keep only last 100 latency timings for average calculation
      if (latencyTimingsRef.current.length > 100) {
        latencyTimingsRef.current.shift();
      }
      updateMetrics('averageLatencyMs');
    } catch (error) {
      debugLog(`Error processing ${eventType}:`, error);
      updateMetrics('totalCacheUpdateErrors');
    }
  };

  /**
   * Reconnect with exponential backoff
   */
  const reconnectWithBackoff = (): void => {
    const config = getReconnectConfig();

    if (reconnectAttemptRef.current >= config.maxAttempts) {
      debugLog('Max reconnection attempts reached, keeping frontend operational', {
        attempts: reconnectAttemptRef.current,
      });
      // eslint-disable-next-line no-console
      console.error(
        `[SSE] Failed to reconnect after ${reconnectAttemptRef.current} attempts. Frontend remains operational without real-time updates.`
      );
      return;
    }

    const delay = calculateReconnectDelay(
      reconnectAttemptRef.current,
      config.baseDelayMs,
      config.maxDelayMs
    );

    reconnectAttemptRef.current += 1;
    updateMetrics('reconnectAttempts');

    debugLog('Scheduling reconnection', {
      attempt: reconnectAttemptRef.current,
      delayMs: delay,
      maxAttempts: config.maxAttempts,
    });

    reconnectTimeoutRef.current = globalThis.setTimeout(() => {
      debugLog('Attempting to reconnect', {
        attempt: reconnectAttemptRef.current,
      });
      connect();
    }, delay);
  };

  /**
   * Connect to SSE endpoint with reconnection logic
   */
  const connect = (): void => {
    const _config = getReconnectConfig();
    const eventSourceURL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';

    try {
      eventSourceRef.current = new EventSource(`${eventSourceURL}/events`);
      debugLog('SSE connection established', { url: `${eventSourceURL}/events` });

      /**
       * Handle buildCreated event: Add new build to builds list
       * Updates cache with optimistic response preventing N+1 queries
       */
      eventSourceRef.current.addEventListener('buildCreated', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('buildCreated');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate buildCreated event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing buildCreated', {
          buildId: eventData.buildId,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('buildCreated', () => {
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
                updateMetrics('totalCacheUpdates');
                return [...existingBuilds, newBuild];
              },
            },
          });
        });
      });

      /**
       * Handle buildStatusChanged event: Update build status in cache
       * Updates specific build without refetching entire list
       */
      eventSourceRef.current.addEventListener('buildStatusChanged', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('buildStatusChanged');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate buildStatusChanged event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing buildStatusChanged', {
          buildId: eventData.buildId,
          newStatus: eventData.payload?.status,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('buildStatusChanged', () => {
          client.cache.modify({
            fields: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              builds(value: unknown, details: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const { readField } = details;
                const existingBuilds = Array.isArray(value)
                  ? (value as Array<Record<string, unknown>>)
                  : [];

                const updated = existingBuilds.map((build) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  if (readField({ fieldName: 'id', from: build }) === eventData.buildId) {
                    updateMetrics('totalCacheUpdates');
                    return {
                      ...build,
                      status: eventData.payload?.status,
                      updatedAt: eventData.payload?.updatedAt ?? new Date().toISOString(),
                    };
                  }
                  return build;
                });
                return updated;
              },
            },
          });
        });
      });

      /**
       * Handle partAdded event: Add new part to build's parts list
       * Mutates build detail cache to include new part
       */
      eventSourceRef.current.addEventListener('partAdded', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.partId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('partAdded');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate partAdded event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing partAdded', {
          buildId: eventData.buildId,
          partId: eventData.partId,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('partAdded', () => {
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
                  const existingParts = readField({
                    fieldName: 'parts',
                    from: existingBuild,
                  }) as Array<Record<string, unknown>> | undefined;
                  const partsArray = Array.isArray(existingParts) ? existingParts : [];

                  const partExists = partsArray.some(
                    (part) =>
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                      (readField({ fieldName: 'id', from: part }) as string) === eventData.partId
                  );

                  if (partExists) return existingBuild;

                  const newPart = {
                    __typename: 'Part',
                    id: eventData.partId,
                    ...((eventData.payload as Record<string, unknown>) ?? {}),
                  };
                  updateMetrics('totalCacheUpdates');
                  return {
                    ...existingBuild,
                    parts: [...partsArray, newPart],
                  };
                },
              },
            });
          } catch (error) {
            debugLog('Failed to update parts in cache', error);
            // Silently ignore if build not yet in cache (will be fetched fresh)
          }
        });
      });

      /**
       * Handle testRunSubmitted event: Add new test run to build's test runs list
       * Mutates build detail cache to include new test run
       */
      eventSourceRef.current.addEventListener('testRunSubmitted', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.testRunId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('testRunSubmitted');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate testRunSubmitted event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing testRunSubmitted', {
          buildId: eventData.buildId,
          testRunId: eventData.testRunId,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('testRunSubmitted', () => {
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
                    (tr) =>
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                      (readField({ fieldName: 'id', from: tr }) as string) === eventData.testRunId
                  );

                  if (testRunExists) return existingBuild;

                  const newTestRun = {
                    __typename: 'TestRun',
                    id: eventData.testRunId,
                    ...((eventData.payload as Record<string, unknown>) ?? {}),
                  };
                  updateMetrics('totalCacheUpdates');
                  return {
                    ...existingBuild,
                    testRuns: [...testRunsArray, newTestRun],
                  };
                },
              },
            });
          } catch (error) {
            debugLog('Failed to update test runs in cache', error);
          }
        });
      });

      /**
       * Handle fileUploaded event: Update relevant build with file reference
       * Stores file metadata for downloaded test reports and CAD files
       */
      eventSourceRef.current.addEventListener('fileUploaded', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.fileId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('fileUploaded');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate fileUploaded event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing fileUploaded', {
          fileId: eventData.fileId,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('fileUploaded', () => {
          debugLog('File upload event received, applications can handle accordingly');
          updateMetrics('totalCacheUpdates');
        });
      });

      /**
       * Handle ciResults event: Update build with CI test results
       * Stores CI/CD pipeline results and test metrics
       */
      eventSourceRef.current.addEventListener('ciResults', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('ciResults');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate ciResults event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing ciResults', {
          buildId: eventData.buildId,
          status: eventData.payload?.status,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('ciResults', () => {
          client.cache.modify({
            fields: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              builds(value: unknown, details: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const { readField } = details;
                const existingBuilds = Array.isArray(value)
                  ? (value as Array<Record<string, unknown>>)
                  : [];

                const updated = existingBuilds.map((build) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                  if (readField({ fieldName: 'id', from: build }) === eventData.buildId) {
                    updateMetrics('totalCacheUpdates');
                    return {
                      ...build,
                      ciStatus: eventData.payload?.status,
                      ciResults: eventData.payload?.results,
                    };
                  }
                  return build;
                });
                return updated;
              },
            },
          });
        });
      });

      /**
       * Handle sensorData event: Record manufacturing sensor readings
       * Stores temperature, pressure, vibration data from shop floor
       */
      eventSourceRef.current.addEventListener('sensorData', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('sensorData');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate sensorData event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing sensorData', {
          buildId: eventData.buildId,
          sensorType: eventData.payload?.sensorType,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('sensorData', () => {
          debugLog('Sensor data event received, applications can persist accordingly');
          updateMetrics('totalCacheUpdates');
        });
      });

      /**
       * Handle partRemoved event: Remove part from build
       */
      eventSourceRef.current.addEventListener('partRemoved', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.partId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('partRemoved');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate partRemoved event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing partRemoved', {
          buildId: eventData.buildId,
          partId: eventData.partId,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('partRemoved', () => {
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
                  const existingParts = readField({
                    fieldName: 'parts',
                    from: existingBuild,
                  }) as Array<Record<string, unknown>> | undefined;
                  const partsArray = Array.isArray(existingParts) ? existingParts : [];

                  const filtered = partsArray.filter(
                    (part) =>
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                      (readField({ fieldName: 'id', from: part }) as string) !== eventData.partId
                  );

                  if (filtered.length !== partsArray.length) {
                    updateMetrics('totalCacheUpdates');
                    return {
                      ...existingBuild,
                      parts: filtered,
                    };
                  }
                  return existingBuild;
                },
              },
            });
          } catch (error) {
            debugLog('Failed to update parts in cache', error);
          }
        });
      });

      /**
       * Handle testRunUpdated event: Update test run status or results
       */
      eventSourceRef.current.addEventListener('testRunUpdated', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.testRunId) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('testRunUpdated');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate testRunUpdated event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing testRunUpdated', {
          buildId: eventData.buildId,
          testRunId: eventData.testRunId,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('testRunUpdated', () => {
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

                  const updated = testRunsArray.map((tr) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    if ((readField({ fieldName: 'id', from: tr }) as string) === eventData.testRunId) {
                      updateMetrics('totalCacheUpdates');
                      return {
                        ...tr,
                        status: eventData.payload?.newStatus ?? eventData.payload?.status,
                        result: eventData.payload?.result,
                        updatedAt: eventData.payload?.updatedAt ?? new Date().toISOString(),
                      };
                    }
                    return tr;
                  });
                  return {
                    ...existingBuild,
                    testRuns: updated,
                  };
                },
              },
            });
          } catch (error) {
            debugLog('Failed to update test run in cache', error);
          }
        });
      });

      /**
       * Handle webhook event: Generic webhook event handling
       */
      eventSourceRef.current.addEventListener('webhook', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData) return;

        updateMetrics('totalEventsReceived');
        updateEventTypeCounter('webhook');

        if (dedupRef.current.isDuplicate(eventData.eventId)) {
          debugLog('Duplicate webhook event skipped', { eventId: eventData.eventId });
          updateMetrics('totalDuplicates');
          return;
        }

        debugLog('Processing webhook', {
          webhookType: eventData.payload?.webhookType,
          eventId: eventData.eventId,
        });

        handleEventWithMetrics('webhook', () => {
          debugLog('Webhook event received, applications can handle accordingly');
          updateMetrics('totalCacheUpdates');
        });
      });

      // Reset reconnection counter on successful connection
      reconnectAttemptRef.current = 0;

      /**
       * Handle connection error and initiate reconnection with exponential backoff
       */
      eventSourceRef.current.addEventListener('error', (): void => {
        debugLog('SSE connection error, initiating reconnection');
        eventSourceRef.current?.close();
        reconnectWithBackoff();
      });
    } catch (error) {
      debugLog('Failed to connect to SSE stream', error);
      reconnectWithBackoff();
    }
  };

  useEffect(() => {
    connect();

    /**
     * Cleanup on unmount
     */
    return (): void => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        globalThis.clearTimeout(reconnectTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);
}
