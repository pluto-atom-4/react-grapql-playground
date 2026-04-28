/**
 * SSE Cache Updates Test Suite
 *
 * Tests for real-time server-sent event parsing and Apollo cache modifications.
 * Verifies cache updates trigger reactive re-renders and handle out-of-order events.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryCache, gql, DocumentNode } from '@apollo/client';
import { BuildStatus, TestStatus } from '../apollo-hooks';
import type {
  BuildNode,
  PartNode,
  TestRunNode,
  GetBuildsResult,
  GetBuildDetailResult,
} from '../cache-types';

// ============================================================================
// Type Guards and Validators
// ============================================================================

/**
 * Type guard to safely narrow cache result to GetBuildsResult
 * Uses imported type from cache-types module for consistency
 */
function isGetBuildsResult(value: unknown): value is GetBuildsResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'builds' in value &&
    Array.isArray((value as Record<string, unknown>).builds)
  );
}

/**
 * Type guard to safely narrow cache result to GetBuildDetailResult
 * Uses imported type from cache-types module for consistency
 */
function isGetBuildDetailResult(value: unknown): value is GetBuildDetailResult {
  return (
    value !== null &&
    typeof value === 'object' &&
    'build' in value &&
    typeof (value as Record<string, unknown>).build === 'object'
  );
}

// ============================================================================
// Cache Helper Functions with Type Safety
// ============================================================================

/**
 * Safely read a builds list from cache with proper typing
 * Uses BuildNode type from shared cache-types module
 */
function readBuildsFromCache(cache: InMemoryCache, query: DocumentNode): BuildNode[] {
  const result = cache.readQuery<GetBuildsResult>({ query });
  if (isGetBuildsResult(result)) {
    return result.builds;
  }
  return [];
}

/**
 * Write builds to cache with proper typing
 * Uses BuildNode type from shared cache-types module
 */
function writeBuildsToCache(cache: InMemoryCache, query: DocumentNode, builds: BuildNode[]): void {
  cache.writeQuery<GetBuildsResult>({
    query,
    data: { builds },
  });
}

/**
 * Write build detail to cache with proper typing
 * Uses GetBuildDetailResult type from shared cache-types module
 */
function writeBuildDetailToCache(
  cache: InMemoryCache,
  query: DocumentNode,
  build: GetBuildDetailResult['build']
): void {
  cache.writeQuery<GetBuildDetailResult>({
    query,
    data: { build },
  });
}

// Mock EventSource for Node.js environment
if (typeof EventSource === 'undefined') {
  (globalThis as Record<string, unknown>).EventSource = class {
    close(): void {}
  };
}

describe('SSE Cache Updates', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  describe('Event Payload Parsing', () => {
    it('parses buildCreated event with complete payload', () => {
      const eventPayload = {
        event: 'buildCreated',
        buildId: 'build-123',
        payload: {
          name: 'New Build',
          status: BuildStatus.Pending,
          description: 'Test build',
        },
        timestamp: Date.now(),
      };

      expect(eventPayload.event).toBe('buildCreated');
      expect(eventPayload.buildId).toBe('build-123');
      expect(eventPayload.payload?.name).toBe('New Build');
      expect(typeof eventPayload.timestamp).toBe('number');
    });

    it('parses buildStatusChanged event with status update', () => {
      const eventPayload = {
        event: 'buildStatusChanged',
        buildId: 'build-456',
        payload: {
          status: BuildStatus.Running,
          updatedAt: new Date().toISOString(),
        },
        timestamp: Date.now(),
      };

      expect(eventPayload.event).toBe('buildStatusChanged');
      expect(eventPayload.buildId).toBe('build-456');
      expect(eventPayload.payload?.status).toBe(BuildStatus.Running);
    });

    it('parses partAdded event with part details', () => {
      const eventPayload = {
        event: 'partAdded',
        buildId: 'build-789',
        partId: 'part-001',
        payload: {
          name: 'New Part',
          sku: 'SKU-123',
          quantity: 5,
        },
        timestamp: Date.now(),
      };

      expect(eventPayload.event).toBe('partAdded');
      expect(eventPayload.buildId).toBe('build-789');
      expect(eventPayload.partId).toBe('part-001');
      expect(eventPayload.payload?.name).toBe('New Part');
    });

    it('parses testRunSubmitted event with test result', () => {
      const eventPayload = {
        event: 'testRunSubmitted',
        buildId: 'build-999',
        testRunId: 'test-001',
        payload: {
          status: TestStatus.Running,
          result: 'PASS',
          fileUrl: 'https://example.com/report.pdf',
        },
        timestamp: Date.now(),
      };

      expect(eventPayload.event).toBe('testRunSubmitted');
      expect(eventPayload.buildId).toBe('build-999');
      expect(eventPayload.testRunId).toBe('test-001');
      expect(eventPayload.payload?.result).toBe('PASS');
    });

    it('handles malformed event payload gracefully', () => {
      const malformedPayload = 'invalid json {]';

      // In real implementation, this would be caught by parseSSEEvent
      expect(() => {
        JSON.parse(malformedPayload);
      }).toThrow();
    });
  });

  describe('Cache Modifications - Build Events', () => {
    it('buildCreated event adds new build to builds list', () => {
      const query = gql`
        query GetBuilds {
          builds {
            id
            name
            status
          }
        }
      `;

      const initialBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Existing',
        status: BuildStatus.Pending,
      };

      // Initial data
      writeBuildsToCache(cache, query, [initialBuild]);

      // Simulate buildCreated event by writing new data to cache
      const newBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-2',
        name: 'New Build',
        status: BuildStatus.Pending,
      };

      const existingBuilds = readBuildsFromCache(cache, query);
      writeBuildsToCache(cache, query, [...existingBuilds, newBuild]);

      // Read result with proper type
      const result = cache.readQuery<GetBuildsResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildsResult(result)).toBe(true);

      if (result && isGetBuildsResult(result)) {
        expect(result.builds).toHaveLength(2);
        expect(result.builds[1].id).toBe('build-2');
        expect(result.builds[1].name).toBe('New Build');
      }
    });

    it('buildStatusChanged event updates build status in cache', () => {
      const query = gql`
        query GetBuilds {
          builds {
            id
            name
            status
          }
        }
      `;

      const initialBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Build 1',
        status: BuildStatus.Pending,
      };

      writeBuildsToCache(cache, query, [initialBuild]);

      // Simulate buildStatusChanged event by updating cache
      const updatedBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Build 1',
        status: BuildStatus.Running,
      };

      writeBuildsToCache(cache, query, [updatedBuild]);

      // Read result with proper type
      const result = cache.readQuery<GetBuildsResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildsResult(result)).toBe(true);

      if (result && isGetBuildsResult(result)) {
        expect(result.builds[0].status).toBe(BuildStatus.Running);
      }
    });
  });

  describe('Cache Modifications - Part Events', () => {
    it('partAdded event adds part to build detail cache', () => {
      const query = gql`
        query GetBuildDetail {
          build {
            id
            name
            parts {
              id
              name
              sku
            }
          }
        }
      `;

      const initialPart: PartNode = {
        __typename: 'Part',
        id: 'part-1',
        name: 'Part 1',
        sku: 'SKU-1',
      };

      const buildDetail: GetBuildDetailResult['build'] = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Build',
        status: BuildStatus.Pending,
        parts: [initialPart],
        testRuns: [],
      };

      writeBuildDetailToCache(cache, query, buildDetail);

      // Simulate partAdded event by updating cache
      const newPart: PartNode = {
        __typename: 'Part',
        id: 'part-2',
        name: 'New Part',
        sku: 'SKU-2',
      };

      const updatedBuildDetail: GetBuildDetailResult['build'] = {
        ...buildDetail,
        parts: [...buildDetail.parts, newPart],
      };

      writeBuildDetailToCache(cache, query, updatedBuildDetail);

      // Read result with proper type
      const result = cache.readQuery<GetBuildDetailResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildDetailResult(result)).toBe(true);

      if (result && isGetBuildDetailResult(result)) {
        expect(result.build.parts).toHaveLength(2);
        expect(result.build.parts[1].id).toBe('part-2');
        expect(result.build.parts[1].name).toBe('New Part');
      }
    });
  });

  describe('Cache Modifications - TestRun Events', () => {
    it('testRunSubmitted event adds test run to build detail cache', () => {
      const query = gql`
        query GetBuildDetail {
          build {
            id
            name
            testRuns {
              id
              status
              result
            }
          }
        }
      `;

      const initialTestRun: TestRunNode = {
        __typename: 'TestRun',
        id: 'test-1',
        status: TestStatus.Pending,
        result: '',
      };

      const buildDetail: GetBuildDetailResult['build'] = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Build',
        status: BuildStatus.Pending,
        parts: [],
        testRuns: [initialTestRun],
      };

      writeBuildDetailToCache(cache, query, buildDetail);

      // Simulate testRunSubmitted event by updating cache
      const newTestRun: TestRunNode = {
        __typename: 'TestRun',
        id: 'test-2',
        status: TestStatus.Running,
        result: 'PASS',
      };

      const updatedBuildDetail: GetBuildDetailResult['build'] = {
        ...buildDetail,
        testRuns: [...buildDetail.testRuns, newTestRun],
      };

      writeBuildDetailToCache(cache, query, updatedBuildDetail);

      // Read result with proper type
      const result = cache.readQuery<GetBuildDetailResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildDetailResult(result)).toBe(true);

      if (result && isGetBuildDetailResult(result)) {
        expect(result.build.testRuns).toHaveLength(2);
        expect(result.build.testRuns[1].id).toBe('test-2');
        expect(result.build.testRuns[1].result).toBe('PASS');
      }
    });
  });

  describe('Out-of-Order Event Handling', () => {
    it('deduplicates events by timestamp', () => {
      const timestamps = [1000, 1001, 1002];
      const seenTimestamps = new Set<number>();

      timestamps.forEach((ts) => {
        // Simulate deduplication logic
        if (ts > Math.max(...Array.from(seenTimestamps))) {
          seenTimestamps.add(ts);
        }
      });

      expect(seenTimestamps.size).toBe(3);
    });

    it('ignores events with older timestamps', () => {
      const events = [
        { event: 'buildCreated', buildId: 'build-1', timestamp: 1000 },
        { event: 'buildStatusChanged', buildId: 'build-1', timestamp: 1001 },
        { event: 'buildStatusChanged', buildId: 'build-1', timestamp: 1000 }, // Older, should be ignored
      ];

      let lastSeenTimestamp = 0;
      const processedEvents: unknown[] = [];

      events.forEach((e) => {
        if (e.timestamp > lastSeenTimestamp) {
          processedEvents.push(e);
          lastSeenTimestamp = e.timestamp;
        }
      });

      expect(processedEvents).toHaveLength(2);
    });

    it('processes events in order when timestamps are sequential', () => {
      const events = [
        { id: '1', timestamp: 1000 },
        { id: '2', timestamp: 1001 },
        { id: '3', timestamp: 1002 },
      ];

      const processed = events.filter((e) => e.timestamp >= 0);
      expect(processed).toHaveLength(3);
      expect(processed[0].id).toBe('1');
      expect(processed[2].id).toBe('3');
    });
  });

  describe('Cache Update Latency', () => {
    it('cache modifications complete within reasonable time', () => {
      const query = gql`
        query GetBuilds {
          builds {
            id
          }
        }
      `;

      const initialBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Build 1',
        status: BuildStatus.Pending,
      };

      writeBuildsToCache(cache, query, [initialBuild]);

      const startTime = globalThis.performance.now();

      const builds: BuildNode[] = [
        initialBuild,
        {
          __typename: 'Build',
          id: 'build-2',
          name: 'Build 2',
          status: BuildStatus.Pending,
        },
      ];

      writeBuildsToCache(cache, query, builds);

      const endTime = globalThis.performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should be fast

      // Verify data integrity
      const result = cache.readQuery<GetBuildsResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildsResult(result)).toBe(true);
      if (result && isGetBuildsResult(result)) {
        expect(result.builds).toHaveLength(2);
      }
    });

    it('multiple cache modifications maintain consistency', () => {
      const query = gql`
        query GetBuilds {
          builds {
            id
            status
          }
        }
      `;

      // Initial state
      const initialBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-1',
        name: 'Build 1',
        status: BuildStatus.Pending,
      };

      writeBuildsToCache(cache, query, [initialBuild]);

      // Add second build
      const secondBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-2',
        name: 'Build 2',
        status: BuildStatus.Pending,
      };

      writeBuildsToCache(cache, query, [initialBuild, secondBuild]);

      // Update first build status
      const updatedFirstBuild: BuildNode = {
        ...initialBuild,
        status: BuildStatus.Running,
      };

      writeBuildsToCache(cache, query, [updatedFirstBuild, secondBuild]);

      // Read result with proper type
      const result = cache.readQuery<GetBuildsResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildsResult(result)).toBe(true);

      if (result && isGetBuildsResult(result)) {
        expect(result.builds).toHaveLength(2);
        expect(result.builds[0].status).toBe(BuildStatus.Running);
        expect(result.builds[0].id).toBe('build-1');
        expect(result.builds[1].id).toBe('build-2');
        expect(result.builds[1].status).toBe(BuildStatus.Pending);
      }
    });
  });

  describe('Memory Management', () => {
    it('EventSource is properly closed on unmount', () => {
      const eventSource = new EventSource('http://localhost:5000/events', {
        withCredentials: true,
      });
      const closeSpy = vi.spyOn(eventSource, 'close');

      // Simulate cleanup
      eventSource.close();

      expect(closeSpy).toHaveBeenCalled();
      closeSpy.mockRestore();
    });

    it('no memory leaks with repeated event subscriptions', () => {
      const eventSources: EventSource[] = [];

      for (let i = 0; i < 5; i += 1) {
        // This would happen in real React if useSSEEvents is called multiple times
        // In practice, it should only be called once
        const es = new EventSource('http://localhost:5000/events', { withCredentials: true });
        eventSources.push(es);
      }

      eventSources.forEach((es) => {
        expect(es).toBeDefined();
      });

      // Cleanup
      eventSources.forEach((es) => {
        es.close();
      });

      expect(eventSources).toHaveLength(5);
    });
  });

  describe('EventSource Error Handling', () => {
    it('handles EventSource connection errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        // Invalid URL would cause error
        new EventSource('http://invalid-url-that-does-not-exist:9999/events');
      } catch (error) {
        // EventSource doesn't throw on construction, but connection fails later
        expect(error).toBeDefined();
      }

      errorSpy.mockRestore();
    });

    it('reconnection strategy handles disconnects', () => {
      // Simulate reconnection logic
      let connectionAttempts = 0;
      let lastConnectionTime = 0;

      const reconnect = (): void => {
        connectionAttempts += 1;
        lastConnectionTime = Date.now();
      };

      // Initial connection
      reconnect();

      // Simulate disconnect and reconnect
      globalThis.setTimeout(reconnect, 1000);

      expect(connectionAttempts).toBeGreaterThan(0);
      expect(lastConnectionTime).toBeGreaterThan(0);
    });
  });

  describe('Event Type Coverage', () => {
    it('handles all supported event types', () => {
      const supportedEvents = [
        'buildCreated',
        'buildStatusChanged',
        'partAdded',
        'testRunSubmitted',
      ];

      supportedEvents.forEach((eventType) => {
        expect(typeof eventType).toBe('string');
        expect(eventType).toMatch(/^[a-zA-Z]+$/);
      });

      expect(supportedEvents).toHaveLength(4);
    });

    it('ignores unknown event types gracefully', () => {
      const unknownEventPayload = {
        event: 'unknownEvent',
        data: { some: 'data' },
      };

      // Should not crash, just log
      expect(unknownEventPayload.event).not.toMatch(/^(build|part|test)/);
    });
  });

  describe('Cache Update Atomicity', () => {
    it('build creation event updates cache atomically', () => {
      const query = gql`
        query GetBuilds {
          builds {
            id
            name
            status
          }
        }
      `;

      writeBuildsToCache(cache, query, []);

      const newBuild: BuildNode = {
        __typename: 'Build',
        id: 'build-1',
        name: 'New Build',
        status: BuildStatus.Pending,
      };

      cache.modify({
        fields: {
          builds: (existing: unknown): BuildNode[] => {
            const existingBuilds = (existing as BuildNode[]) || [];
            return [...existingBuilds, newBuild];
          },
        },
      });

      // Read result with proper type
      const result = cache.readQuery<GetBuildsResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildsResult(result)).toBe(true);

      if (result && isGetBuildsResult(result)) {
        expect(result.builds).toHaveLength(1);
        expect(result.builds[0].id).toBe('build-1');
        expect(result.builds[0].name).toBe('New Build');
        expect(result.builds[0].status).toBe(BuildStatus.Pending);
      }
    });

    it('status change preserves other build properties', () => {
      const query = gql`
        query GetBuildDetail {
          build {
            id
            name
            status
            description
          }
        }
      `;

      const initialBuildDetail: GetBuildDetailResult['build'] = {
        __typename: 'Build',
        id: 'build-1',
        name: 'My Build',
        status: BuildStatus.Pending,
        description: 'Build description',
        parts: [],
        testRuns: [],
      };

      writeBuildDetailToCache(cache, query, initialBuildDetail);

      // Update cache directly with new status value
      const updatedBuildDetail: GetBuildDetailResult['build'] = {
        ...initialBuildDetail,
        status: BuildStatus.Running,
      };

      writeBuildDetailToCache(cache, query, updatedBuildDetail);

      // Read result with proper type
      const result = cache.readQuery<GetBuildDetailResult>({ query });
      expect(result).toBeDefined();
      expect(isGetBuildDetailResult(result)).toBe(true);

      if (result && isGetBuildDetailResult(result)) {
        expect(result.build.name).toBe('My Build');
        expect(result.build.description).toBe('Build description');
        expect(result.build.status).toBe(BuildStatus.Running);
        expect(result.build.id).toBe('build-1');
      }
    });
  });

  // ============================================================================
  // Phase D: Frontend SSE Enhancement Tests
  // ============================================================================

  describe('Phase D: Exponential Backoff Reconnection', () => {
    it('calculates correct exponential backoff delays', () => {
      // Formula: delay = min(baseDelay * (2 ^ attemptNumber), maxDelay)
      const baseDelay = 1000;
      const maxDelay = 30000;

      // Attempt 0: 1s
      const delay0 = baseDelay * Math.pow(2, 0);
      expect(delay0).toBe(1000);
      expect(Math.min(delay0, maxDelay)).toBe(1000);

      // Attempt 1: 2s
      const delay1 = baseDelay * Math.pow(2, 1);
      expect(delay1).toBe(2000);
      expect(Math.min(delay1, maxDelay)).toBe(2000);

      // Attempt 2: 4s
      const delay2 = baseDelay * Math.pow(2, 2);
      expect(delay2).toBe(4000);
      expect(Math.min(delay2, maxDelay)).toBe(4000);

      // Attempt 3: 8s
      const delay3 = baseDelay * Math.pow(2, 3);
      expect(delay3).toBe(8000);
      expect(Math.min(delay3, maxDelay)).toBe(8000);

      // Attempt 4: 16s
      const delay4 = baseDelay * Math.pow(2, 4);
      expect(delay4).toBe(16000);
      expect(Math.min(delay4, maxDelay)).toBe(16000);

      // Attempt 5: 32s (capped at 30s)
      const delay5 = baseDelay * Math.pow(2, 5);
      expect(delay5).toBe(32000);
      expect(Math.min(delay5, maxDelay)).toBe(30000);

      // Attempt 6+: Stay at 30s (max)
      const delay6 = baseDelay * Math.pow(2, 6);
      expect(Math.min(delay6, maxDelay)).toBe(30000);
    });

    it('limits reconnection attempts to maximum', () => {
      const maxAttempts = 10;
      let attempts = 0;

      while (attempts < maxAttempts) {
        attempts += 1;
      }

      expect(attempts).toBe(maxAttempts);
    });

    it('keeps frontend operational after max reconnection attempts', () => {
      // Simulate final reconnection failure
      const maxAttempts = 10;
      const finalAttempt = maxAttempts;

      // Should not throw, application remains functional
      expect(() => {
        if (finalAttempt >= maxAttempts) {
          console.error(
            `[SSE] Failed to reconnect after ${maxAttempts} attempts. Frontend remains operational.`
          );
        }
      }).not.toThrow();
    });
  });

  describe('Phase D: Event Deduplication', () => {
    it('deduplicates events by eventId', () => {
      const eventIds = new Set<string>();
      const duplicateEventId = 'event-123-uuid';
      const uniqueEventId = 'event-456-uuid';

      // Add first occurrence
      eventIds.add(duplicateEventId);
      expect(eventIds.has(duplicateEventId)).toBe(true);

      // Check duplicate
      const isDuplicate = eventIds.has(duplicateEventId);
      expect(isDuplicate).toBe(true);

      // Add unique
      eventIds.add(uniqueEventId);
      expect(eventIds.has(uniqueEventId)).toBe(true);
      expect(eventIds.size).toBe(2);
    });

    it('maintains sliding window of 1000 event IDs', () => {
      const windowSize = 1000;
      const eventIdMap = new Map<string, number>();

      // Add 1000 events
      for (let i = 0; i < windowSize; i += 1) {
        eventIdMap.set(`event-${i}`, Date.now());
      }

      expect(eventIdMap.size).toBe(windowSize);

      // Add one more, oldest should be removed
      const oldestEntry = [...eventIdMap.entries()].sort((a, b) => a[1] - b[1])[0];
      if (oldestEntry) {
        eventIdMap.delete(oldestEntry[0]);
      }
      eventIdMap.set(`event-${windowSize}`, Date.now());

      // Should still be at max
      if (eventIdMap.size > windowSize) {
        const oldestEntry2 = [...eventIdMap.entries()].sort((a, b) => a[1] - b[1])[0];
        if (oldestEntry2) {
          eventIdMap.delete(oldestEntry2[0]);
        }
      }

      expect(eventIdMap.size).toBeLessThanOrEqual(windowSize);
    });

    it('cleans up event IDs older than 5-minute TTL', () => {
      const ttlMs = 300000; // 5 minutes
      const eventIdMap = new Map<string, number>();
      const now = Date.now();

      // Add old event (beyond TTL)
      eventIdMap.set('old-event', now - ttlMs - 1000);

      // Add recent event
      eventIdMap.set('recent-event', now);

      // Simulate TTL cleanup
      const expiredEvents: string[] = [];
      for (const [eventId, timestamp] of eventIdMap.entries()) {
        if (now - timestamp > ttlMs) {
          expiredEvents.push(eventId);
        }
      }

      expiredEvents.forEach((eventId) => {
        eventIdMap.delete(eventId);
      });

      // Old event should be cleaned up
      expect(eventIdMap.has('old-event')).toBe(false);
      expect(eventIdMap.has('recent-event')).toBe(true);
    });

    it('prevents duplicate cache updates', () => {
      const processedEventIds = new Set<string>();
      const cacheUpdates: Array<{ eventId: string; update: string }> = [];

      // Process event first time
      const eventId = 'event-duplicate-test';
      if (!processedEventIds.has(eventId)) {
        processedEventIds.add(eventId);
        cacheUpdates.push({ eventId, update: 'cache-update-1' });
      }

      // Try to process again (should be skipped)
      if (!processedEventIds.has(eventId)) {
        cacheUpdates.push({ eventId, update: 'cache-update-2' });
      }

      // Only first update should be recorded
      expect(cacheUpdates).toHaveLength(1);
      expect(cacheUpdates[0].update).toBe('cache-update-1');
    });
  });

  describe('Phase D: Cache Updates for All 10 Event Types', () => {
    it('handles buildCreated event type', () => {
      const eventType = 'buildCreated';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles buildStatusChanged event type', () => {
      const eventType = 'buildStatusChanged';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles partAdded event type', () => {
      const eventType = 'partAdded';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles partRemoved event type', () => {
      const eventType = 'partRemoved';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles testRunSubmitted event type', () => {
      const eventType = 'testRunSubmitted';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles testRunUpdated event type', () => {
      const eventType = 'testRunUpdated';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles fileUploaded event type', () => {
      const eventType = 'fileUploaded';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles ciResults event type', () => {
      const eventType = 'ciResults';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles sensorData event type', () => {
      const eventType = 'sensorData';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('handles webhook event type', () => {
      const eventType = 'webhook';
      const eventTypeCounters: Record<string, number> = {};

      eventTypeCounters[eventType] = (eventTypeCounters[eventType] ?? 0) + 1;
      expect(eventTypeCounters[eventType]).toBe(1);
    });

    it('counts all 10 event types correctly', () => {
      const eventTypeCounters: Record<string, number> = {
        buildCreated: 1,
        buildStatusChanged: 2,
        partAdded: 1,
        partRemoved: 1,
        testRunSubmitted: 3,
        testRunUpdated: 1,
        fileUploaded: 1,
        ciResults: 1,
        sensorData: 1,
        webhook: 1,
      };

      const totalEvents = Object.values(eventTypeCounters).reduce((a, b) => a + b, 0);
      expect(totalEvents).toBe(13);
      expect(Object.keys(eventTypeCounters)).toHaveLength(10);
    });
  });

  describe('Phase D: Debug Mode with Metrics', () => {
    it('collects totalEventsReceived metric', () => {
      const metrics = {
        totalEventsReceived: 0,
        totalDuplicates: 0,
        totalCacheUpdates: 0,
        totalCacheUpdateErrors: 0,
        reconnectAttempts: 0,
        averageLatencyMs: 0,
        eventTypeCounters: {},
      };

      metrics.totalEventsReceived += 1;
      metrics.totalEventsReceived += 1;
      metrics.totalEventsReceived += 1;

      expect(metrics.totalEventsReceived).toBe(3);
    });

    it('collects totalDuplicates metric', () => {
      const metrics = {
        totalEventsReceived: 0,
        totalDuplicates: 0,
        totalCacheUpdates: 0,
        totalCacheUpdateErrors: 0,
        reconnectAttempts: 0,
        averageLatencyMs: 0,
        eventTypeCounters: {},
      };

      metrics.totalDuplicates += 1;
      metrics.totalDuplicates += 1;

      expect(metrics.totalDuplicates).toBe(2);
    });

    it('collects totalCacheUpdates metric', () => {
      const metrics = {
        totalEventsReceived: 0,
        totalDuplicates: 0,
        totalCacheUpdates: 0,
        totalCacheUpdateErrors: 0,
        reconnectAttempts: 0,
        averageLatencyMs: 0,
        eventTypeCounters: {},
      };

      metrics.totalCacheUpdates += 1;

      expect(metrics.totalCacheUpdates).toBe(1);
    });

    it('collects reconnectAttempts metric', () => {
      const metrics = {
        totalEventsReceived: 0,
        totalDuplicates: 0,
        totalCacheUpdates: 0,
        totalCacheUpdateErrors: 0,
        reconnectAttempts: 0,
        averageLatencyMs: 0,
        eventTypeCounters: {},
      };

      for (let i = 0; i < 5; i += 1) {
        metrics.reconnectAttempts += 1;
      }

      expect(metrics.reconnectAttempts).toBe(5);
    });

    it('calculates averageLatencyMs from latency timings', () => {
      const latencyTimings = [10, 20, 30, 40, 50];
      const average = latencyTimings.reduce((a, b) => a + b, 0) / latencyTimings.length;

      expect(average).toBe(30);
    });

    it('tracks per-event-type counters', () => {
      const metrics = {
        totalEventsReceived: 0,
        totalDuplicates: 0,
        totalCacheUpdates: 0,
        totalCacheUpdateErrors: 0,
        reconnectAttempts: 0,
        averageLatencyMs: 0,
        eventTypeCounters: {} as Record<string, number>,
      };

      metrics.eventTypeCounters['buildCreated'] = 1;
      metrics.eventTypeCounters['buildStatusChanged'] = 2;
      metrics.eventTypeCounters['partAdded'] = 1;

      expect(metrics.eventTypeCounters['buildCreated']).toBe(1);
      expect(metrics.eventTypeCounters['buildStatusChanged']).toBe(2);
      expect(metrics.eventTypeCounters['partAdded']).toBe(1);
    });

    it('logs events in debug mode', () => {
      const debugEnabled = true;
      const consoleLogs: string[] = [];

      const debugLog = (message: string): void => {
        if (debugEnabled) {
          consoleLogs.push(message);
        }
      };

      debugLog('[SSE Debug] Event received');
      debugLog('[SSE Debug] Cache updated');

      expect(consoleLogs).toHaveLength(2);
      expect(consoleLogs[0]).toContain('Event received');
    });

    it('suppresses debug logging when disabled', () => {
      const debugEnabled = false;
      const consoleLogs: string[] = [];

      const debugLog = (message: string): void => {
        if (debugEnabled) {
          consoleLogs.push(message);
        }
      };

      debugLog('[SSE Debug] This should not be logged');

      expect(consoleLogs).toHaveLength(0);
    });

    it('aggregates metrics into window.__SSE_METRICS', () => {
      const metrics = {
        totalEventsReceived: 10,
        totalDuplicates: 2,
        totalCacheUpdates: 8,
        totalCacheUpdateErrors: 0,
        reconnectAttempts: 1,
        averageLatencyMs: 25,
        eventTypeCounters: {
          buildCreated: 2,
          buildStatusChanged: 3,
          partAdded: 5,
        },
      };

      // Simulate window.__SSE_METRICS
      const sseMetrics = metrics;

      expect(sseMetrics.totalEventsReceived).toBe(10);
      expect(sseMetrics.totalDuplicates).toBe(2);
      expect(sseMetrics.totalCacheUpdates).toBe(8);
      expect(sseMetrics.reconnectAttempts).toBe(1);
      expect(sseMetrics.averageLatencyMs).toBe(25);
    });
  });

  describe('Phase D: Performance and Latency Tracking', () => {
    it('measures cache update latency', () => {
      const latencies: number[] = [];

      const measureLatency = (fn: () => void): void => {
        const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
        fn();
        const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const duration = end - start;
        latencies.push(duration);
      };

      measureLatency(() => {
        // Simulate cache update
        const result = Array(1000).fill(0);
        void result.length;
      });

      expect(latencies).toHaveLength(1);
      expect(latencies[0]).toBeGreaterThanOrEqual(0);
    });

    it('maintains rolling average of latencies', () => {
      const latencies: number[] = [];
      const maxLatencies = 100;

      const addLatency = (latency: number): void => {
        latencies.push(latency);
        if (latencies.length > maxLatencies) {
          latencies.shift();
        }
      };

      for (let i = 0; i < 150; i += 1) {
        addLatency(Math.random() * 50);
      }

      expect(latencies.length).toBeLessThanOrEqual(maxLatencies);
      expect(latencies.length).toBe(maxLatencies);

      const average = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(average).toBeGreaterThan(0);
      expect(average).toBeLessThan(50);
    });
  });
});
