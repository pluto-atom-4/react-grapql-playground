import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import type { BuildData } from '../BuildOverviewTab';
import { BuildOverviewTab } from '../BuildOverviewTab';
import type { Part } from '../BuildPartsTab';
import { BuildPartsTab } from '../BuildPartsTab';
import type { TestRun } from '../BuildTestRunsTab';
import { BuildTestRunsTab } from '../BuildTestRunsTab';
import { useBuildTabs } from '../../lib/hooks/useBuildTabs';

describe('Tab Content Components', () => {
  describe('BuildOverviewTab', () => {
    const mockBuild: BuildData = {
      id: 'build-123',
      name: 'Build Alpha',
      description: 'Test build for overview',
      status: 'COMPLETE' as any,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T12:00:00Z',
      owner: 'test@example.com',
      version: '1.0.0',
      tags: ['production', 'critical'],
    };

    it('should display build overview information', () => {
      render(
        <BuildOverviewTab buildId="build-123" build={mockBuild} />,
      );

      expect(screen.getByText('build-123')).toBeInTheDocument();
      expect(screen.getByText('Build Alpha')).toBeInTheDocument();
      expect(screen.getByText('Test build for overview')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('should show loading skeleton', () => {
      const { container } = render(
        <BuildOverviewTab buildId="build-123" isLoading={true} />,
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should display tags', () => {
      render(
        <BuildOverviewTab buildId="build-123" build={mockBuild} />,
      );

      expect(screen.getByText('production')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
    });

    it('should have action buttons', () => {
      render(
        <BuildOverviewTab buildId="build-123" build={mockBuild} />,
      );

      expect(screen.getByText('Edit Build')).toBeInTheDocument();
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should call onUpdate callback', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(
        <BuildOverviewTab buildId="build-123" build={mockBuild} onUpdate={onUpdate} />,
      );

      await user.click(screen.getByText('Edit Build'));
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  describe('BuildPartsTab', () => {
    const mockParts: Part[] = [
      { id: 'part-1', buildId: 'build-123', name: 'Part A', sku: 'SKU-001', quantity: 10 },
      { id: 'part-2', buildId: 'build-123', name: 'Part B', sku: 'SKU-002', quantity: 5 },
    ];

    it('should display parts list', () => {
      render(
        <BuildPartsTab buildId="build-123" parts={mockParts} />,
      );

      expect(screen.getByText('Part A')).toBeInTheDocument();
      expect(screen.getByText('Part B')).toBeInTheDocument();
      expect(screen.getByText(/SKU-001/)).toBeInTheDocument();
    });

    it('should filter parts by search', async () => {
      const user = userEvent.setup();
      render(
        <BuildPartsTab buildId="build-123" parts={mockParts} />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by name or SKU/);
      await user.type(searchInput, 'Part B');

      expect(screen.getByText('Part B')).toBeInTheDocument();
      expect(screen.queryByText('Part A')).not.toBeInTheDocument();
    });

    it('should have Add Part button', () => {
      render(
        <BuildPartsTab buildId="build-123" parts={mockParts} />,
      );

      expect(screen.getByText('+ Add Part')).toBeInTheDocument();
    });

    it('should call onPartRemoved when clicking Remove', async () => {
      const user = userEvent.setup();
      const onPartRemoved = vi.fn();
      render(
        <BuildPartsTab buildId="build-123" parts={mockParts} onPartRemoved={onPartRemoved} />,
      );

      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[0]);

      expect(onPartRemoved).toHaveBeenCalledWith('part-1');
    });

    it('should show empty state when no parts', () => {
      render(
        <BuildPartsTab buildId="build-123" parts={[]} />,
      );

      expect(screen.getByText('No parts found')).toBeInTheDocument();
    });

    it('should show loading skeleton', () => {
      const { container } = render(
        <BuildPartsTab buildId="build-123" isLoading={true} />,
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('BuildTestRunsTab', () => {
    const mockTestRuns: TestRun[] = [
      {
        id: 'test-1',
        buildId: 'build-123',
        name: 'Unit Tests',
        status: 'COMPLETE' as any,
        result: 'PASSED',
        duration: 5000,
        passedTests: 25,
        failedTests: 0,
      },
      {
        id: 'test-2',
        buildId: 'build-123',
        name: 'Integration Tests',
        status: 'COMPLETE' as any,
        result: 'FAILED',
        duration: 10000,
        passedTests: 15,
        failedTests: 2,
      },
    ];

    it('should display test runs list', () => {
      render(
        <BuildTestRunsTab buildId="build-123" testRuns={mockTestRuns} />,
      );

      expect(screen.getByText('Unit Tests')).toBeInTheDocument();
      expect(screen.getByText('Integration Tests')).toBeInTheDocument();
    });

    it('should filter test runs by search', async () => {
      const user = userEvent.setup();
      render(
        <BuildTestRunsTab buildId="build-123" testRuns={mockTestRuns} />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by test name/);
      await user.type(searchInput, 'Unit');

      expect(screen.getByText('Unit Tests')).toBeInTheDocument();
      expect(screen.queryByText('Integration Tests')).not.toBeInTheDocument();
    });

    it('should display test results', () => {
      render(
        <BuildTestRunsTab buildId="build-123" testRuns={mockTestRuns} />,
      );

      const results = screen.getAllByText(/PASSED|FAILED/);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should display test statistics', () => {
      render(
        <BuildTestRunsTab buildId="build-123" testRuns={mockTestRuns} />,
      );

      expect(screen.getByText(/25 passed, 0 failed/)).toBeInTheDocument();
      expect(screen.getByText(/15 passed, 2 failed/)).toBeInTheDocument();
    });

    it('should have Add Test Run button', () => {
      render(
        <BuildTestRunsTab buildId="build-123" testRuns={mockTestRuns} />,
      );

      expect(screen.getByText('+ Add Test Run')).toBeInTheDocument();
    });

    it('should show empty state when no test runs', () => {
      render(
        <BuildTestRunsTab buildId="build-123" testRuns={[]} />,
      );

      expect(screen.getByText('No test runs found')).toBeInTheDocument();
    });

    it('should show loading skeleton', () => {
      const { container } = render(
        <BuildTestRunsTab buildId="build-123" isLoading={true} />,
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('useBuildTabs Hook', () => {
    it('should initialize with default tab', () => {
      const { result } = renderHook(() => useBuildTabs('overview'));

      expect(result.current.activeTab).toBe('overview');
      expect(result.current.loadedTabs.has('overview')).toBe(true);
    });

    it('should set active tab', async () => {
      const { result } = renderHook(() => useBuildTabs('overview'));

      await act(async () => {
        result.current.setActiveTab('parts');
      });
      expect(result.current.activeTab).toBe('parts');
    });

    it('should mark tabs as loaded when set active', async () => {
      const { result } = renderHook(() => useBuildTabs('overview'));

      await act(async () => {
        result.current.setActiveTab('parts');
      });
      expect(result.current.loadedTabs.has('parts')).toBe(true);
    });

    it('should track loading state per tab', async () => {
      const { result } = renderHook(() => useBuildTabs('overview'));

      await act(async () => {
        result.current.setTabLoading('parts', true);
      });
      expect(result.current.isLoading.parts).toBe(true);

      await act(async () => {
        result.current.setTabLoading('parts', false);
      });
      expect(result.current.isLoading.parts).toBe(false);
    });

    it('should initialize all tabs with loading=false', () => {
      const { result } = renderHook(() => useBuildTabs());

      expect(result.current.isLoading.overview).toBe(false);
      expect(result.current.isLoading.parts).toBe(false);
      expect(result.current.isLoading.tests).toBe(false);
      expect(result.current.isLoading.history).toBe(false);
    });

    it('should not reload already-loaded tabs', () => {
      const { result } = renderHook(() => useBuildTabs('overview'));

      const initialSize = result.current.loadedTabs.size;

      // Set to same tab again
      result.current.setActiveTab('overview');

      expect(result.current.loadedTabs.size).toBe(initialSize);
    });
  });
});
