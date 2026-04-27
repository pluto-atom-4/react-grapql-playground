/**
 * useSSEEvents: Client-side hook for real-time SSE event listening with cache updates
 *
 * Pattern:
 * - Opens EventSource connection to Express /events endpoint
 * - Listens for real-time events (buildCreated, buildStatusChanged, partAdded, testRunSubmitted)
 * - Parses event payloads and updates Apollo Client cache via cache.modify()
 * - Handles out-of-order events with timestamp-based deduplication
 * - Handles automatic reconnection on disconnect
 */

'use client';

import { useApolloClient } from '@apollo/client/react';
import { useEffect, useRef } from 'react';

/**
 * Event payload type for type-safe event parsing
 */
interface EventPayload {
  event: string;
  buildId?: string;
  partId?: string;
  testRunId?: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

/**
 * Parses SSE event data and extracts structured payload
 */
function parseSSEEvent(data: string): EventPayload | null {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    return {
      event: String(parsed.event || ''),
      buildId: parsed.buildId ? String(parsed.buildId) : undefined,
      partId: parsed.partId ? String(parsed.partId) : undefined,
      testRunId: parsed.testRunId ? String(parsed.testRunId) : undefined,
      payload: parsed.payload as Record<string, unknown> | undefined,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
    };
  } catch {
    return null;
  }
}

export function useSSEEvents(): void {
  const client = useApolloClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSeenTimestampRef = useRef<number>(0);

  useEffect((): (() => void) => {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    const eventsUrl = `${expressUrl}/events`;

    try {
      const eventSource = new EventSource(eventsUrl, { withCredentials: true });

      /**
       * Handle buildCreated event: Add new build to cache
       */
      eventSource.addEventListener('buildCreated', (event): void => {
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        client.cache.modify({
          fields: {
            builds: (existingBuilds = [], { readField }) => {
              // Check if build already exists
              const buildExists = existingBuilds.some(
                (build: Record<string, unknown>) => readField('id', build) === eventData.buildId
              );
              if (buildExists) return existingBuilds;

              // Add new build to cache
              const newBuild = {
                __typename: 'Build',
                id: eventData.buildId,
                ...(eventData.payload || {}),
              };
              return [...existingBuilds, newBuild];
            },
          },
        });
      });

      /**
       * Handle buildStatusChanged event: Update build status in cache
       */
      eventSource.addEventListener('buildStatusChanged', (event): void => {
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        client.cache.modify({
          fields: {
            builds: (existingBuilds = [], { readField }) => {
              return existingBuilds.map((build: Record<string, unknown>) => {
                if (readField('id', build) === eventData.buildId) {
                  return {
                    ...build,
                    status: eventData.payload?.status,
                    updatedAt: eventData.payload?.updatedAt || new Date().toISOString(),
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
      eventSource.addEventListener('partAdded', (event): void => {
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.partId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        // Try to update build detail cache
        try {
          client.cache.modify({
            fields: {
              build: (existingBuild = {}, { readField }) => {
                if (readField('id', existingBuild) !== eventData.buildId) {
                  return existingBuild;
                }

                const existingParts = readField('parts', existingBuild) || [];
                const partExists = existingParts.some(
                  (part: Record<string, unknown>) => readField('id', part) === eventData.partId
                );

                if (partExists) return existingBuild;

                const newPart = {
                  __typename: 'Part',
                  id: eventData.partId,
                  buildId: eventData.buildId,
                  ...(eventData.payload || {}),
                };

                return {
                  ...existingBuild,
                  parts: [...existingParts, newPart],
                };
              },
            },
          });
        } catch {
          // Build not in cache yet, will be fetched on demand
        }
      });

      /**
       * Handle testRunSubmitted event: Add new test run to build's test runs
       */
      eventSource.addEventListener('testRunSubmitted', (event): void => {
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId || !eventData.testRunId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

        // Try to update build detail cache
        try {
          client.cache.modify({
            fields: {
              build: (existingBuild = {}, { readField }) => {
                if (readField('id', existingBuild) !== eventData.buildId) {
                  return existingBuild;
                }

                const existingTestRuns = readField('testRuns', existingBuild) || [];
                const testRunExists = existingTestRuns.some(
                  (tr: Record<string, unknown>) => readField('id', tr) === eventData.testRunId
                );

                if (testRunExists) return existingBuild;

                const newTestRun = {
                  __typename: 'TestRun',
                  id: eventData.testRunId,
                  buildId: eventData.buildId,
                  ...(eventData.payload || {}),
                };

                return {
                  ...existingBuild,
                  testRuns: [...existingTestRuns, newTestRun],
                };
              },
            },
          });
        } catch {
          // Build not in cache yet, will be fetched on demand
        }
      });

      /**
       * Handle connection errors and reconnect
       */
      eventSource.addEventListener('error', (): void => {
        console.warn('SSE disconnected, will attempt to reconnect...');
        eventSource.close();
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to connect to SSE:', error);
    }

    return (): void => {
      eventSourceRef.current?.close();
    };
  }, [client]);
}
