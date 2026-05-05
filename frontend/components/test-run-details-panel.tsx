'use client';

import React, { useMemo, type ReactElement } from 'react';
import { useTestRuns } from '@/lib/apollo-hooks';
import { TestStatus, type TestRun } from '@/lib/generated/graphql';

/**
 * Props for TestRunDetailsPanel component
 */
export interface TestRunDetailsPanelProps {
  /** The build ID this test run belongs to */
  buildId: string;
  /** The test run ID to display */
  testRunId: string;
  /** Called when user closes the panel */
  onClose: () => void;
}

/**
 * Format an ISO 8601 date string to a readable format
 * @param isoString - ISO 8601 date string
 * @returns Formatted date string (e.g., "Apr 16, 2026 2:30 PM")
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Get the appropriate icon component for a test status
 * @param status - The test run status
 * @returns Icon component
 */
function getStatusIcon(status: TestStatus): ReactElement {
  switch (status) {
    case TestStatus.Passed:
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l4-4m-4 4l-4 4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case TestStatus.Failed:
      return (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case TestStatus.Pending:
    case TestStatus.Running:
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

/**
 * Get the appropriate color class for a test status
 * @param status - The test run status
 * @returns Tailwind color class
 */
function getStatusColorClass(status: TestStatus): string {
  switch (status) {
    case TestStatus.Passed:
      return 'text-green-700';
    case TestStatus.Failed:
      return 'text-red-700';
    case TestStatus.Pending:
    case TestStatus.Running:
      return 'text-gray-700';
    default:
      return 'text-gray-700';
  }
}

/**
 * Get the background color class for a test status badge
 * @param status - The test run status
 * @returns Tailwind background color class
 */
function getStatusBgColorClass(status: TestStatus): string {
  switch (status) {
    case TestStatus.Passed:
      return 'bg-green-50';
    case TestStatus.Failed:
      return 'bg-red-50';
    case TestStatus.Pending:
    case TestStatus.Running:
      return 'bg-gray-50';
    default:
      return 'bg-gray-50';
  }
}

/**
 * TestRunDetailsPanel Component
 *
 * Displays comprehensive information about a single test run, including:
 * - Status badge with icon
 * - Test result summary
 * - File download link (if available)
 * - Creation and completion timestamps
 * - Loading and error states
 * - Close button
 *
 * @example
 * ```tsx
 * <TestRunDetailsPanel
 *   buildId="build-123"
 *   testRunId="test-run-456"
 *   onClose={() => setShowPanel(false)}
 * />
 * ```
 */
export const TestRunDetailsPanel: React.FC<TestRunDetailsPanelProps> = ({
  buildId,
  testRunId,
  onClose,
}): ReactElement => {
  const { testRuns, loading, error } = useTestRuns(buildId);

  // Find the test run by ID
  const testRun = useMemo<TestRun | undefined>(
    () => testRuns.find((t) => t.id === testRunId),
    [testRuns, testRunId]
  );

  // Render loading state
  if (loading && !testRun) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Test Run Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-center py-8" aria-busy="true">
            <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 text-sm text-gray-600">Loading test run details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Test Run Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-md border border-red-200">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">Failed to load test run details. Please try again.</p>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Render test run not found state
  if (!testRun) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Test Run Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-md border border-yellow-200">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-yellow-700">Test run not found.</p>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Render success state with test run details
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Test Run Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Badge Section */}
        <div className={`mb-6 p-3 rounded-md ${getStatusBgColorClass(testRun.status)}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon(testRun.status)}
            <span className={`font-semibold ${getStatusColorClass(testRun.status)}`}>
              {testRun.status}
            </span>
          </div>
        </div>

        {/* Result Summary Section */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Test Result</label>
          <p className="text-base text-gray-900">
            {testRun.result || <span className="text-gray-500 italic">No result summary provided</span>}
          </p>
        </div>

        {/* File Download Section */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Evidence File</label>
          {testRun.fileUrl ? (
            <a
              href={testRun.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
              aria-label={`Download evidence file for test run ${testRun.id}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Evidence
            </a>
          ) : (
            <p className="text-gray-500 italic text-sm">No evidence file attached</p>
          )}
        </div>

        {/* Timestamps Section */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Created</label>
          <p className="text-sm text-gray-600">{formatDate(testRun.createdAt as string)}</p>
        </div>

        {/* Completion Timestamp */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Completed</label>
          <p className="text-sm text-gray-600">
            {testRun.completedAt ? formatDate(testRun.completedAt as string) : 'Pending'}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};
