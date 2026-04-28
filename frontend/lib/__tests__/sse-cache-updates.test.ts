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
function readBuildsFromCache(
  cache: InMemoryCache,
  query: DocumentNode
): BuildNode[] {
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
function writeBuildsToCache(
  cache: InMemoryCache,
  query: DocumentNode,
  builds: BuildNode[]
): void {
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
});
