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
    const event = parsed.event;
    const buildId = parsed.buildId;
    const partId = parsed.partId;
    const testRunId = parsed.testRunId;

    return {
      event: typeof event === 'string' ? event : '',
      buildId: typeof buildId === 'string' ? buildId : undefined,
      partId: typeof partId === 'string' ? partId : undefined,
      testRunId: typeof testRunId === 'string' ? testRunId : undefined,
      payload: parsed.payload as Record<string, unknown> | undefined,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Hook to listen for SSE events and update Apollo cache in real-time
 */
export function useSSEEvents(): void {
  const client = useApolloClient();
  const lastSeenTimestampRef = useRef<number>(0);

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
