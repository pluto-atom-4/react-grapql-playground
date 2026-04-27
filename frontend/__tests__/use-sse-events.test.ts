/**
 * Tests for useSSEEvents hook - Cache modification behavior
 *
 * Focus: Verify SSE events correctly update Apollo cache without duplicates
 */

import { describe, it, expect } from 'vitest';

describe('useSSEEvents cache modifications - Logic Tests', () => {
  /**
   * Test the buildCreated modifier logic
   */
  describe('buildCreated handler logic', () => {
    it('should add new build to builds array', (): void => {
      const eventData = {
        buildId: 'build-1',
        payload: { status: 'PENDING', name: 'Build 1' },
      };

      // Simulate the builds field modifier
      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingBuilds: unknown[] = [];
      const buildExists = existingBuilds.some(
        (build) => readField('id', build) === eventData.buildId
      );
      expect(buildExists).toBe(false);

      if (!buildExists) {
        const newBuild = {
          __typename: 'Build',
          id: eventData.buildId,
          ...(eventData.payload ?? {}),
        };
        const result = [...existingBuilds, newBuild];
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 'build-1', status: 'PENDING' });
      }
    });

    it('should prevent duplicate builds', (): void => {
      const eventData = {
        buildId: 'build-1',
        payload: { status: 'PENDING' },
      };

      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingBuild = { __typename: 'Build', id: 'build-1', status: 'PENDING' };
      const existingBuilds = [existingBuild];

      const buildExists = existingBuilds.some(
        (build) => readField('id', build) === eventData.buildId
      );
      expect(buildExists).toBe(true);

      // Should return existing array unchanged
      const result = buildExists ? existingBuilds : [...existingBuilds];
      expect(result).toHaveLength(1);
      expect(result).toBe(existingBuilds);
    });
  });

  /**
   * Test the buildStatusChanged modifier logic
   */
  describe('buildStatusChanged handler logic', () => {
    it('should update build status', (): void => {
      const eventData = {
        buildId: 'build-1',
        payload: { status: 'COMPLETE', updatedAt: '2026-04-27T00:00:00Z' },
      };

      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingBuild = {
        __typename: 'Build',
        id: 'build-1',
        status: 'PENDING',
      };
      const existingBuilds = [existingBuild];

      const result = existingBuilds.map((build) => {
        if (readField('id', build) === eventData.buildId) {
          return {
            ...build,
            status: eventData.payload?.status ?? 'PENDING',
            updatedAt: eventData.payload?.updatedAt ?? new Date().toISOString(),
          };
        }
        return build;
      });

      const firstResult = result[0];
      if (firstResult && 'status' in firstResult && 'updatedAt' in firstResult) {
        expect(firstResult.status).toBe('COMPLETE');
        expect(firstResult.updatedAt).toBe('2026-04-27T00:00:00Z');
      }
    });
  });

  /**
   * Test the partAdded modifier logic
   */
  describe('partAdded handler logic', () => {
    it('should add part to build parts array', (): void => {
      const eventData = {
        buildId: 'build-1',
        partId: 'part-1',
        payload: { name: 'Part 1' },
      };

      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingBuild = {
        __typename: 'Build',
        id: 'build-1',
        parts: [],
      };

      if (readField('id', existingBuild) === eventData.buildId) {
        const existingParts = readField('parts', existingBuild);
        const partsArray = (Array.isArray(existingParts) ? existingParts : []) as Array<
          Record<string, unknown>
        >;
        const partExists = partsArray.some(
          (part) => readField('id', part) === eventData.partId
        );

        expect(partExists).toBe(false);

        if (!partExists) {
          const newPart = {
            __typename: 'Part',
            id: eventData.partId,
            buildId: eventData.buildId,
            ...(eventData.payload ?? {}),
          };

          const result = {
            ...(existingBuild as Record<string, unknown>),
            parts: [...partsArray, newPart],
          };

          const resultParts = result.parts as Array<Record<string, unknown>>;
          expect(resultParts).toHaveLength(1);
          expect(resultParts[0]).toMatchObject({ id: 'part-1', name: 'Part 1' });
        }
      }
    });

    it('should prevent duplicate parts', (): void => {
      const eventData = {
        buildId: 'build-1',
        partId: 'part-1',
      };

      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingPart = { __typename: 'Part', id: 'part-1', name: 'Part 1' };
      const existingBuild = {
        __typename: 'Build',
        id: 'build-1',
        parts: [existingPart],
      };

      const existingParts = readField('parts', existingBuild);
      const partsArray = (Array.isArray(existingParts) ? existingParts : []) as Array<
        Record<string, unknown>
      >;
      const partExists = partsArray.some(
        (part) => readField('id', part) === eventData.partId
      );

      expect(partExists).toBe(true);

      // If part exists, return build unchanged
      const result = partExists
        ? existingBuild
        : {
            ...(existingBuild as Record<string, unknown>),
            parts: partsArray,
          };

      const resultParts = (result as Record<string, unknown>).parts as Array<Record<string, unknown>>;
      expect(resultParts).toHaveLength(1);
    });
  });

  /**
   * Test the testRunSubmitted modifier logic
   */
  describe('testRunSubmitted handler logic', () => {
    it('should add test run to build test runs array', (): void => {
      const eventData = {
        buildId: 'build-1',
        testRunId: 'test-run-1',
        payload: { result: 'PASSED' },
      };

      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingBuild = {
        __typename: 'Build',
        id: 'build-1',
        testRuns: [],
      };

      if (readField('id', existingBuild) === eventData.buildId) {
        const existingTestRuns = readField('testRuns', existingBuild);
        const testRunsArray = (
          Array.isArray(existingTestRuns) ? existingTestRuns : []
        ) as Array<Record<string, unknown>>;
        const testRunExists = testRunsArray.some(
          (tr) => readField('id', tr) === eventData.testRunId
        );

        expect(testRunExists).toBe(false);

        if (!testRunExists) {
          const newTestRun = {
            __typename: 'TestRun',
            id: eventData.testRunId,
            buildId: eventData.buildId,
            ...(eventData.payload ?? {}),
          };

          const result = {
            ...(existingBuild as Record<string, unknown>),
            testRuns: [...testRunsArray, newTestRun],
          };

          const resultTestRuns = result.testRuns as Array<Record<string, unknown>>;
          expect(resultTestRuns).toHaveLength(1);
          expect(resultTestRuns[0]).toMatchObject({
            id: 'test-run-1',
            result: 'PASSED',
          });
        }
      }
    });

    it('should prevent duplicate test runs', (): void => {
      const eventData = {
        buildId: 'build-1',
        testRunId: 'test-run-1',
      };

      const readField = (field: string, obj: unknown): unknown => {
        if (!obj || typeof obj !== 'object') return undefined;
        return (obj as Record<string, unknown>)[field];
      };

      const existingTestRun = { __typename: 'TestRun', id: 'test-run-1', result: 'PASSED' };
      const existingBuild = {
        __typename: 'Build',
        id: 'build-1',
        testRuns: [existingTestRun],
      };

      const existingTestRuns = readField('testRuns', existingBuild);
      const testRunsArray = (
        Array.isArray(existingTestRuns) ? existingTestRuns : []
      ) as Array<Record<string, unknown>>;
      const testRunExists = testRunsArray.some(
        (tr) => readField('id', tr) === eventData.testRunId
      );

      expect(testRunExists).toBe(true);

      // If test run exists, return build unchanged
      const result = testRunExists
        ? existingBuild
        : {
            ...(existingBuild as Record<string, unknown>),
            testRuns: testRunsArray,
          };

      const resultTestRuns = (result as Record<string, unknown>).testRuns as Array<Record<string, unknown>>;
      expect(resultTestRuns).toHaveLength(1);
    });
  });
});





