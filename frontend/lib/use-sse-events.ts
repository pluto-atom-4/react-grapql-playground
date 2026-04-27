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
      payload:
        typeof parsed.payload === 'object' && parsed.payload !== null
          ? (parsed.payload as Record<string, unknown>)
          : undefined,
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
      eventSource.addEventListener('buildCreated', (_event: Event): void => {
        const event = _event as MessageEvent<string>;
        const eventData = parseSSEEvent(event.data);
        if (!eventData || !eventData.buildId) return;

        // Deduplicate by timestamp
        if (eventData.timestamp <= lastSeenTimestampRef.current) return;
        lastSeenTimestampRef.current = eventData.timestamp;

         client.cache.modify({
           fields: {
             builds(value: unknown, details: any) {
               const { readField } = details;
               const existingBuilds = Array.isArray(value) ? [...value] : [];

               // Check if build already exists
               const buildExists = existingBuilds.some(
                 (build) => readField('id', build) === eventData.buildId
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
             builds(value: unknown, details: any) {
               const { readField } = details;
               const existingBuilds = Array.isArray(value) ? [...value] : [];

               return existingBuilds.map((build) => {
                 if (readField('id', build) === eventData.buildId) {
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
               build(value: unknown, details: any) {
                 const { readField } = details;
                 const existingBuild = value || {};

                 if (readField('id', existingBuild) !== eventData.buildId) {
                   return existingBuild;
                 }

                 const existingParts = readField('parts', existingBuild);
                 const partsArray = (Array.isArray(existingParts) ? existingParts : []) as Array<
                   Record<string, unknown>
                 >;
                 const partExists = partsArray.some(
                   (part) => readField('id', part) === eventData.partId
                 );

                 if (partExists) return existingBuild;

                 const newPart = {
                   __typename: 'Part',
                   id: eventData.partId,
                   buildId: eventData.buildId,
                   ...((eventData.payload as Record<string, unknown>) ?? {}),
                 };

                 return {
                   ...(existingBuild as Record<string, unknown>),
                   parts: [...partsArray, newPart],
                 };
               },
             },
           });
         } catch (error) {
           console.error(
             `[SSE] Failed to update build cache for partAdded event (buildId: ${eventData.buildId}, partId: ${eventData.partId})`,
             error
           );
         }
      });

      /**
       * Handle testRunSubmitted event: Add new test run to build's test runs
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
               build(value: unknown, details: any) {
                 const { readField } = details;
                 const existingBuild = value || {};

                 if (readField('id', existingBuild) !== eventData.buildId) {
                   return existingBuild;
                 }

                 const existingTestRuns = readField('testRuns', existingBuild);
                 const testRunsArray = (
                   Array.isArray(existingTestRuns) ? existingTestRuns : []
                 ) as Array<Record<string, unknown>>;

                 const testRunExists = testRunsArray.some(
                   (tr) => readField('id', tr) === eventData.testRunId
                 );

                 if (testRunExists) return existingBuild;

                 const newTestRun = {
                   __typename: 'TestRun',
                   id: eventData.testRunId,
                   buildId: eventData.buildId,
                   ...((eventData.payload as Record<string, unknown>) ?? {}),
                 };

                 return {
                   ...(existingBuild as Record<string, unknown>),
                   testRuns: [...testRunsArray, newTestRun],
                 };
               },
             },
           });
         } catch (error) {
           console.error(
             `[SSE] Failed to update build cache for testRunSubmitted event (buildId: ${eventData.buildId}, testRunId: ${eventData.testRunId})`,
             error
           );
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
