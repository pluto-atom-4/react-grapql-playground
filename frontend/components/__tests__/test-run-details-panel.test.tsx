import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TestRunDetailsPanel, type TestRunDetailsPanelProps } from '../test-run-details-panel';
import * as apolloHooks from '@/lib/apollo-hooks';
import { TestStatus, type TestRun } from '@/lib/generated/graphql';

// Mock the apollo hooks
vi.mock('@/lib/apollo-hooks', () => ({
  useTestRuns: vi.fn(),
  TestStatus: {
    Passed: 'PASSED',
    Failed: 'FAILED',
    Pending: 'PENDING',
    Running: 'RUNNING',
  },
}));

// Sample test run data
const mockTestRunPassed: TestRun = {
  __typename: 'TestRun',
  id: 'test-run-1',
  buildId: 'build-123',
  status: TestStatus.Passed,
  result: 'All tests passed successfully',
  fileUrl: 'http://example.com/test-report.pdf',
  createdAt: '2026-04-16T14:30:00Z',
  completedAt: '2026-04-16T14:35:00Z',
  updatedAt: '2026-04-16T14:35:00Z',
};

const mockTestRunFailed: TestRun = {
  __typename: 'TestRun',
  id: 'test-run-2',
  buildId: 'build-123',
  status: TestStatus.Failed,
  result: 'Test failed: timeout exceeded',
  fileUrl: 'http://example.com/failed-report.pdf',
  createdAt: '2026-04-16T14:30:00Z',
  completedAt: '2026-04-16T14:40:00Z',
  updatedAt: '2026-04-16T14:40:00Z',
};

const mockTestRunPending: TestRun = {
  __typename: 'TestRun',
  id: 'test-run-3',
  buildId: 'build-123',
  status: TestStatus.Pending,
  result: undefined,
  fileUrl: undefined,
  createdAt: '2026-04-16T14:30:00Z',
  completedAt: undefined,
  updatedAt: '2026-04-16T14:30:00Z',
};

const mockTestRunNoResult: TestRun = {
  __typename: 'TestRun',
  id: 'test-run-4',
  buildId: 'build-123',
  status: TestStatus.Passed,
  result: undefined,
  fileUrl: 'http://example.com/report-no-result.pdf',
  createdAt: '2026-04-16T14:30:00Z',
  completedAt: '2026-04-16T14:35:00Z',
  updatedAt: '2026-04-16T14:35:00Z',
};

const mockTestRunNoFile: TestRun = {
  __typename: 'TestRun',
  id: 'test-run-5',
  buildId: 'build-123',
  status: TestStatus.Passed,
  result: 'Tests completed',
  fileUrl: undefined,
  createdAt: '2026-04-16T14:30:00Z',
  completedAt: '2026-04-16T14:35:00Z',
  updatedAt: '2026-04-16T14:35:00Z',
};

describe('TestRunDetailsPanel', () => {
  const mockOnClose = vi.fn();
  const defaultProps: TestRunDetailsPanelProps = {
    buildId: 'build-123',
    testRunId: 'test-run-1',
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing with valid test run', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('Test Run Details')).toBeInTheDocument();
    });

    it('renders close button', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close panel');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders all major sections when test run loaded', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('Test Run Details')).toBeInTheDocument();
      expect(screen.getByText('Test Result')).toBeInTheDocument();
      expect(screen.getByText('Evidence File')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('uses correct buildId and testRunId from props', () => {
      const useTestRunsSpy = vi.mocked(apolloHooks.useTestRuns);
      useTestRunsSpy.mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-456"
          testRunId="test-run-789"
          onClose={mockOnClose}
        />
      );

      expect(useTestRunsSpy).toHaveBeenCalledWith('build-456');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when useTestRuns loading is true', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('Loading test run details...')).toBeInTheDocument();
    });

    it('hides details when loading', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.queryByText('Test Result')).not.toBeInTheDocument();
    });

    it('shows spinner with aria-busy for accessibility', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(<TestRunDetailsPanel {...defaultProps} />);
      const busyDiv = container.querySelector('[aria-busy="true"]');
      expect(busyDiv).toBeInTheDocument();
    });
  });

  describe('Error & Not Found States', () => {
    it('shows error message when useTestRuns hook has error', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [],
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(
        screen.getByText('Failed to load test run details. Please try again.')
      ).toBeInTheDocument();
    });

    it('shows test run not found message when testRun is undefined', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="non-existent-id"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Test run not found.')).toBeInTheDocument();
    });

    it('error message is visible and readable', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [],
        loading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const errorMessage = screen.getByText('Failed to load test run details. Please try again.');
      expect(errorMessage).toBeVisible();
    });
  });

  describe('Status Badge', () => {
    it('renders PASSED status correctly', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('PASSED')).toBeInTheDocument();
    });

    it('renders FAILED status correctly', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunFailed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-2"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('FAILED')).toBeInTheDocument();
    });

    it('renders PENDING status correctly', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPending],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-3"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('status badge has appropriate color for PASSED', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(<TestRunDetailsPanel {...defaultProps} />);
      const statusBadge = container.querySelector('.text-green-700');
      expect(statusBadge).toBeInTheDocument();
    });

    it('status badge has appropriate color for FAILED', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunFailed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-2"
          onClose={mockOnClose}
        />
      );
      const statusBadge = container.querySelector('.text-red-700');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Result Display', () => {
    it('displays result summary when result exists', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('All tests passed successfully')).toBeInTheDocument();
    });

    it('shows placeholder when result is empty', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunNoResult],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-4"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('No result summary provided')).toBeInTheDocument();
    });

    it('shows placeholder when result is null', () => {
      const testRunWithNullResult: TestRun = {
        ...mockTestRunPassed,
        result: null,
      };

      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [testRunWithNullResult],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-1"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('No result summary provided')).toBeInTheDocument();
    });
  });

  describe('File Download', () => {
    it('shows download link with FileIcon when fileUrl exists', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('Download Evidence')).toBeInTheDocument();
    });

    it('download link href is testRun.fileUrl', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const downloadLink = screen.getByText('Download Evidence');
      expect((downloadLink as HTMLAnchorElement).href).toBe('http://example.com/test-report.pdf');
    });

    it('download link has target="_blank"', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const downloadLink = screen.getByText('Download Evidence');
      expect((downloadLink as HTMLAnchorElement).target).toBe('_blank');
    });

    it('shows placeholder when fileUrl is null/undefined', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunNoFile],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-5"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('No evidence file attached')).toBeInTheDocument();
    });

    it('placeholder text is "No evidence file attached"', () => {
      const testRunNoFileUrl: TestRun = {
        ...mockTestRunPassed,
        fileUrl: undefined,
      };

      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [testRunNoFileUrl],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-1"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('No evidence file attached')).toBeInTheDocument();
    });

    it('download link has aria-label for accessibility', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const downloadLink = screen.getByLabelText(/Download evidence file/i);
      expect(downloadLink).toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('formats and displays createdAt timestamp', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(<TestRunDetailsPanel {...defaultProps} />);
      // Check that created label is there
      expect(screen.getByText('Created')).toBeInTheDocument();
      // Check that the rendered content contains formatted date
      const allText = container.textContent || '';
      expect(allText).toContain('Apr');
      expect(allText).toContain('2026');
    });

    it('formats and displays completedAt timestamp when available', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(<TestRunDetailsPanel {...defaultProps} />);
      // Check that completed label is present
      expect(screen.getByText('Completed')).toBeInTheDocument();
      // Check that the rendered content contains formatted date
      const allText = container.textContent || '';
      expect(allText).toContain('Apr');
    });

    it('shows "Pending" for missing completedAt', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPending],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-3"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('timestamps are in readable format', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      // Check for readable date format (Month, day, year, time)
      const createdSection = screen.getByText('Created');
      const dateText = createdSection.parentElement?.querySelector('p')?.textContent;
      expect(dateText).toMatch(/\d{1,2}.*\d{4}/); // Should have day and year
      expect(dateText).toMatch(/\d{2}:\d{2}/); // Should have time
    });
  });

  describe('Close Button', () => {
    it('close button onClick calls onClose callback', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close panel');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('close button has accessible aria-label', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
    });

    it('bottom close button also calls onClose callback', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const closeButtons = screen.getAllByRole('button').filter((btn) =>
        btn.textContent?.includes('Close')
      );
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(closeButtons[closeButtons.length - 1]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('close button has focus visible state', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close panel');
      expect(closeButton).toBeInTheDocument();
      // Button should have hover effect class
      expect(closeButton.className).toContain('hover:');
    });
  });

  describe('Hook Integration', () => {
    it('component calls useTestRuns with correct buildId', () => {
      const useTestRunsSpy = vi.mocked(apolloHooks.useTestRuns);
      useTestRunsSpy.mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel buildId="build-999" testRunId="test-run-1" onClose={mockOnClose} />);

      expect(useTestRunsSpy).toHaveBeenCalledWith('build-999');
    });

    it('component filters testRuns to find matching testRunId', () => {
      const multipleTestRuns = [mockTestRunPassed, mockTestRunFailed, mockTestRunPending];
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: multipleTestRuns,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-2"
          onClose={mockOnClose}
        />
      );
      // Should render the failed test run details
      expect(screen.getByText('FAILED')).toBeInTheDocument();
      expect(screen.getByText('Test failed: timeout exceeded')).toBeInTheDocument();
    });

    it('panel renders correctly with mocked hook data', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('All tests passed successfully')).toBeInTheDocument();
      expect(screen.getByText('PASSED')).toBeInTheDocument();
    });

    it('handles testRunId not in testRuns array', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="non-existent"
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText('Test run not found.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty result string gracefully', () => {
      const testRunEmptyResult: TestRun = {
        ...mockTestRunPassed,
        result: '',
      };

      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [testRunEmptyResult],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('No result summary provided')).toBeInTheDocument();
    });

    it('handles null fileUrl gracefully', () => {
      const testRunNullFileUrl: TestRun = {
        ...mockTestRunPassed,
        fileUrl: null,
      };

      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [testRunNullFileUrl],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('No evidence file attached')).toBeInTheDocument();
    });

    it('handles missing completedAt gracefully', () => {
      const testRunMissingCompleted: TestRun = {
        ...mockTestRunPassed,
        completedAt: null,
      };

      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [testRunMissingCompleted],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('panel handles rapid close/reopen', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(<TestRunDetailsPanel {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close panel');

      // Close
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      // Reopen
      rerender(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByText('Test Run Details')).toBeInTheDocument();
    });

    it('ARIA labels present on all text and icons', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<TestRunDetailsPanel {...defaultProps} />);
      expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
      expect(screen.getByLabelText(/Download evidence file/i)).toBeInTheDocument();
    });
  });

  describe('All Test Status Types', () => {
    it('renders icon for PASSED status', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPassed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(<TestRunDetailsPanel {...defaultProps} />);
      const icon = container.querySelector('.text-green-600');
      expect(icon).toBeInTheDocument();
    });

    it('renders icon for FAILED status', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunFailed],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-2"
          onClose={mockOnClose}
        />
      );
      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('renders icon for PENDING status', () => {
      vi.mocked(apolloHooks.useTestRuns).mockReturnValue({
        testRuns: [mockTestRunPending],
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { container } = render(
        <TestRunDetailsPanel
          buildId="build-123"
          testRunId="test-run-3"
          onClose={mockOnClose}
        />
      );
      const icon = container.querySelector('.text-gray-500');
      expect(icon).toBeInTheDocument();
    });
  });
});
