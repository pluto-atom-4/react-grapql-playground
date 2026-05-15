'use client';

import { useCallback, useState } from 'react';
import {
  useBuildDetail,
  useUpdateBuildStatus,
  useAddPart,
  useSubmitTestRun,
  TestStatus,
} from '@/lib/apollo-hooks';
import { useActivityFeed } from './useActivityFeed';
import { useTestRuns } from './useTestRuns';
import { useSSEEvents } from '../use-sse-events';
import type {
  BuildDetailModalState,
  BuildData,
  PartData,
  TestRunData,
  TabEventHandlers,
  BuildHistoryEvent,
} from '@/lib/types/modal-types';

/**
 * useBuildDetailModal Hook
 *
 * Centralized state management for BuildDetailModal
 * Consolidates all data fetching, mutations, and real-time event handling
 *
 * Features:
 * - Single source of truth for build data (build, parts, testRuns, history)
 * - Unified mutation handlers (edit, add, delete actions)
 * - SSE event listener for real-time updates (via useSSEEvents)
 * - Cache management integration with Apollo
 * - Error handling and loading states
 * - Tab state management (activeTab tracking)
 *
 * @param buildId - The ID of the build to manage
 * @returns State and handlers for BuildDetailModal
 *
 * @example
 * const { state, handlers, setActiveTab } = useBuildDetailModal(buildId);
 * // Use state for rendering
 * // Use handlers for tab component callbacks
 * // Use setActiveTab for tab switching
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useBuildDetailModal(buildId: string) {
  // Core data hooks
  const { build, loading: buildLoading, error: buildError, refetch: refetchBuild } = useBuildDetail(buildId);
  const { testRuns, loading: testRunsLoading, error: testRunsError } = useTestRuns(buildId);
  const { events, loading: eventsLoading } = useActivityFeed(buildId);

  // Mutation hooks
  const { updateStatus } = useUpdateBuildStatus();
  const { addPart } = useAddPart();
  const { submitTestRun } = useSubmitTestRun();

  // SSE event listener for real-time updates
  // This hook automatically updates Apollo cache on SSE events
  useSSEEvents();

  // Local state
  const [activeTab, setActiveTab] = useState<'overview' | 'parts' | 'testRuns' | 'history'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | undefined>();
  const [selectedTestRunId, setSelectedTestRunId] = useState<string | undefined>();
  const [localError, setLocalError] = useState<Error | null>(null);

  // Consolidate state
  const buildData: BuildData | undefined = build
    ? {
        id: build.id,
        name: build.name,
        description: build.description || undefined,
        status: build.status,
        createdAt: String(build.createdAt),
        updatedAt: String(build.updatedAt),
      }
    : undefined;

  const partsData: PartData[] = Array.isArray(build?.parts)
    ? (build.parts as PartData[])
    : [];
  const testRunsData: TestRunData[] = Array.isArray(testRuns)
    ? (testRuns as TestRunData[])
    : [];
  const eventsData: BuildHistoryEvent[] = Array.isArray(events)
    ? (events as BuildHistoryEvent[])
    : [];

  const state: BuildDetailModalState = {
    buildId,
    build: buildData,
    parts: partsData,
    testRuns: testRunsData,
    events: eventsData,
    activeTab,
    loading: buildLoading || testRunsLoading || eventsLoading,
    error: buildError || testRunsError ? (new Error('Failed to load modal data')) : localError,
    isUpdating,
    selectedPartId,
    selectedTestRunId,
  };

  // Edit build handler
  const handleEditBuild = useCallback(
    async (data: Partial<BuildData>): Promise<void> => {
      try {
        setIsUpdating(true);
        setLocalError(null);

        if (data.status && data.status !== build?.status) {
          await updateStatus(buildId, data.status);
        }

        // Refetch to ensure all changes are reflected
        void refetchBuild();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setLocalError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [build, buildId, updateStatus, refetchBuild],
  );

  // Add part handler
  const handleAddPart = useCallback(
    async (data: Partial<PartData>): Promise<void> => {
      try {
        setIsUpdating(true);
        setLocalError(null);

        if (!data.name || !data.sku) {
          throw new Error('Part name and SKU are required');
        }

        await addPart(buildId, data.name, data.sku, data.quantity || 1);

        // Refetch to get updated parts list
        void refetchBuild();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setLocalError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [buildId, addPart, refetchBuild],
  );

  // Add test run handler
  const handleAddTestRun = useCallback(
    async (data: Partial<TestRunData>): Promise<void> => {
      try {
        setIsUpdating(true);
        setLocalError(null);

        if (!data.status) {
          throw new Error('Test run status is required');
        }

        // Convert status string to TestStatus enum
        const testStatus = String(data.status).toUpperCase();
        const validStatuses = Object.values(TestStatus);
        if (!validStatuses.includes(testStatus as TestStatus)) {
          throw new Error(`Invalid test status: ${data.status}`);
        }

        await submitTestRun(buildId, testStatus as TestStatus);

        // Test runs will be updated via polling or SSE
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setLocalError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [buildId, submitTestRun],
  );

  // Drill-down handlers
  const handleDrillDownPart = useCallback((partId: string): void => {
    setSelectedPartId(partId);
  }, []);

  const handleDrillDownTestRun = useCallback((testRunId: string): void => {
    setSelectedTestRunId(testRunId);
  }, []);

  // Clear drill-down selections
  const clearDrillDown = useCallback((): void => {
    setSelectedPartId(undefined);
    setSelectedTestRunId(undefined);
  }, []);

  // Consolidated event handlers for tabs
  const handlers: TabEventHandlers = {
    onEditBuild: handleEditBuild,
    onAddPart: handleAddPart,
    onAddTestRun: handleAddTestRun,
    onDrillDownPart: handleDrillDownPart,
    onDrillDownTestRun: handleDrillDownTestRun,
  };

  return {
    state,
    handlers,
    activeTab,
    setActiveTab,
    selectedPartId,
    selectedTestRunId,
    clearDrillDown,
    refetchBuild,
  };
}
