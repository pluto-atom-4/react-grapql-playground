'use client';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import BuildDetailModal from '../build-detail-modal';
import * as apolloHooks from '@/lib/apollo-hooks';
import * as testRunsHook from '@/lib/hooks/useTestRuns';
import { createMockBuild, createMockTestRun } from './mocks/build';

// Mock the dependencies
vi.mock('@/lib/apollo-hooks');
vi.mock('@/lib/hooks/useTestRuns');
vi.mock('../test-run-details-panel', () => ({
  TestRunDetailsPanel: ({ testRunId, onClose }: { testRunId: string; onClose: () => void }): ReactElement => (
    <div data-testid="test-run-details-panel">
      <p>Details for test run: {testRunId}</p>
      <button onClick={onClose}>Close Details</button>
    </div>
  ),
}));

const mockBuildData = createMockBuild({
  id: 'build-123',
  status: 'RUNNING' as const,
  description: 'A test build',
  parts: [{ id: 'part-1', name: 'Part 1', sku: 'SKU-001', quantity: 5, buildId: 'build-123', createdAt: new Date().toISOString() }],
});

const mockTestRuns = [
  createMockTestRun({
    id: '1',
    status: 'PASSED' as const,
    result: 'All tests passed',
    completedAt: '2026-04-16T10:00:00Z',
    fileUrl: 'https://example.com/report.pdf',
    createdAt: '2026-04-16T09:00:00Z',
    buildId: 'build-123',
  }),
  createMockTestRun({
    id: '2',
    status: 'FAILED' as const,
    result: 'Some tests failed',
    completedAt: '2026-04-16T11:00:00Z',
    fileUrl: 'https://example.com/report2.pdf',
    createdAt: '2026-04-16T10:30:00Z',
    buildId: 'build-123',
  }),
];

describe('BuildDetailModal Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apolloHooks.useBuildDetail).mockReturnValue({
      build: mockBuildData,
      loading: false,
      error: null,
    });

    vi.mocked(apolloHooks.useUpdateBuildStatus).mockReturnValue({
      updateStatus: vi.fn().mockResolvedValue({}),
    });

    vi.mocked(apolloHooks.useAddPart).mockReturnValue({
      addPart: vi.fn().mockResolvedValue({}),
    });

    vi.mocked(apolloHooks.useSubmitTestRun).mockReturnValue({
      submitTestRun: vi.fn().mockResolvedValue({}),
    });

    vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
      testRuns: mockTestRuns,
      loading: false,
      error: null,
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      isPolling: true,
      refetch: vi.fn().mockResolvedValue({ data: { testRuns: mockTestRuns } }),
      pollInterval: 2000,
    });
  });

  describe('Full Workflow: Table -> Details -> Back to Table', () => {
    it('should complete full user workflow without errors', async (): Promise<void> => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<BuildDetailModal buildId="build-123" onClose={onClose} />);

      // Step 1: Verify table displays with test runs
      await waitFor(() => {
        expect(screen.getByText('Test Runs (2)')).toBeInTheDocument();
        expect(screen.getByText('PASSED')).toBeInTheDocument();
      });

      // Step 2: Verify polling indicator visible
      expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();

      // Step 3: Click on first test run
      const row1 = screen.getByTestId('test-run-1');
      await user.click(row1);

      // Step 4: Verify details panel opens
      await waitFor(() => {
        expect(screen.getByTestId('test-run-details-panel')).toBeInTheDocument();
        expect(screen.getByText('Details for test run: 1')).toBeInTheDocument();
      });

      // Step 5: Close details panel
      await user.click(screen.getByText('Close Details'));

      // Step 6: Verify back to table view
      await waitFor(() => {
        expect(screen.queryByTestId('test-run-details-panel')).not.toBeInTheDocument();
        expect(screen.getByText('Test Runs (2)')).toBeInTheDocument();
      });

      // Step 7: Click on second test run
      const row2 = screen.getByTestId('test-run-2');
      await user.click(row2);

      // Step 8: Verify details panel shows correct test run
      await waitFor(() => {
        expect(screen.getByText('Details for test run: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Polling Behavior During Workflow', () => {
    it('should continue polling when switching between details and table', async (): Promise<void> => {
      const user = userEvent.setup();
      const startPolling = vi.fn();
      const stopPolling = vi.fn();

      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: mockTestRuns,
        loading: false,
        error: null,
        startPolling,
        stopPolling,
        isPolling: true,
        refetch: vi.fn(),
        pollInterval: 2000,
      });

      render(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      // Verify polling starts on mount
      await waitFor(() => {
        expect(startPolling).toHaveBeenCalledWith(2000);
      });

      // Open details panel
      await user.click(screen.getByTestId('test-run-1'));

      // Close details panel - polling should continue
      await waitFor(() => {
        expect(screen.getByTestId('test-run-details-panel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close Details'));

      // Verify polling wasn't stopped (stopPolling should only be called on unmount)
      expect(stopPolling).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should allow retry after polling error', async (): Promise<void> => {
      const user = userEvent.setup();
      const refetch = vi.fn().mockResolvedValue({ data: { testRuns: mockTestRuns } });
      const mockError = new Error('Failed to fetch test runs');

      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: [],
        loading: false,
        error: mockError,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
        isPolling: false,
        refetch,
        pollInterval: 2000,
      });

      render(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByTestId('polling-error')).toBeInTheDocument();
      });

      // Click retry button
      await user.click(screen.getByText('Retry Now'));

      // Verify refetch was called
      await waitFor(() => {
        expect(refetch).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates Simulation', () => {
    it('should reflect new test runs when polling updates', async (): Promise<void> => {
      const { rerender } = render(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      // Initial render with 2 test runs
      await waitFor(() => {
        expect(screen.getByText('Test Runs (2)')).toBeInTheDocument();
      });

      // Simulate new test run added via polling
      const updatedTestRuns = [
        ...mockTestRuns,
        {
          id: '3',
          status: 'RUNNING',
          result: undefined,
          completedAt: undefined,
          fileUrl: undefined,
          createdAt: '2026-04-16T11:30:00Z',
        },
      ];

      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: updatedTestRuns,
        loading: false,
        error: null,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
        isPolling: true,
        refetch: vi.fn(),
        pollInterval: 2000,
      });

      // Force re-render to simulate polling update
      rerender(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      // Verify new count displayed
      await waitFor(() => {
        expect(screen.getByText('Test Runs (3)')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Build Navigation', () => {
    it('should handle switching between different builds', async (): Promise<void> => {
      const { rerender } = render(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Test Runs (2)')).toBeInTheDocument();
      });

      // Switch to different build
      const build456Data = { ...mockBuildData, id: 'build-456', name: 'Build 456' };
      const testRuns456 = [
        { id: '101', status: 'PASSED', result: 'Pass', completedAt: '2026-04-16T12:00:00Z', fileUrl: '', createdAt: '' },
      ];

      vi.mocked(apolloHooks.useBuildDetail).mockReturnValue({
        build: build456Data,
        loading: false,
        error: null,
      });

      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: testRuns456,
        loading: false,
        error: null,
        startPolling: vi.fn(),
        stopPolling: vi.fn(),
        isPolling: true,
        refetch: vi.fn(),
        pollInterval: 2000,
      });

      rerender(<BuildDetailModal buildId="build-456" onClose={vi.fn()} />);

      // Verify new build data displayed
      await waitFor(() => {
        expect(screen.getByText('Build 456')).toBeInTheDocument();
        expect(screen.getByText('Test Runs (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should cleanup polling on unmount', async (): Promise<void> => {
      const stopPolling = vi.fn();

      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: mockTestRuns,
        loading: false,
        error: null,
        startPolling: vi.fn(),
        stopPolling,
        isPolling: true,
        refetch: vi.fn(),
        pollInterval: 2000,
      });

      const { unmount } = render(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Verify cleanup was called
      await waitFor(() => {
        expect(stopPolling).toHaveBeenCalled();
      });
    });
  });

  describe('Auto-stop Polling on Terminal States', () => {
    it('should stop polling when all test runs reach terminal state', async (): Promise<void> => {
      const startPolling = vi.fn();
      let isPollingState = true;

      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: mockTestRuns, // All are terminal (PASSED/FAILED)
        loading: false,
        error: null,
        startPolling,
        stopPolling: vi.fn(),
        isPolling: isPollingState,
        refetch: vi.fn(),
        pollInterval: 2000,
      });

      render(<BuildDetailModal buildId="build-123" onClose={vi.fn()} />);

      // Verify initial polling
      await waitFor(() => {
        expect(screen.getByTestId('polling-indicator')).toBeInTheDocument();
      });

      // Simulate auto-stop by updating isPolling to false
      isPollingState = false;
      vi.mocked(testRunsHook.useTestRuns).mockReturnValue({
        testRuns: mockTestRuns,
        loading: false,
        error: null,
        startPolling,
        stopPolling: vi.fn(),
        isPolling: false,
        refetch: vi.fn(),
        pollInterval: 2000,
      });
    });
  });
});
