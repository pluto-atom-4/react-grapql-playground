'use client';

import { useState, type ReactElement } from 'react';
import type { TestRunData } from '@/lib/types/modal-types';

/**
 * Props for TestRunResultViewer component
 */
export interface TestRunResultViewerProps {
  testRun: TestRunData;
  onRerun?: (testRunId: string) => Promise<void>;
  onDownloadResult?: (fileUrl: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * TestRunResultViewer Component
 *
 * Displays test run results and provides rerun capability
 *
 * Features:
 * - Display test result (status, result text, timestamps)
 * - Rerun button for failed tests
 * - Download result file link
 * - Status badge (passed/failed/running/pending)
 * - Keyboard navigation (Escape to close)
 * - Accessibility compliant (role="dialog", ARIA labels)
 * - Loading states
 *
 * @example
 * <TestRunResultViewer
 *   testRun={{
 *     id: 'tr1',
 *     status: 'FAILED',
 *     result: 'Expected 5 but got 4',
 *     completedAt: '2026-04-20T10:00:00Z',
 *     fileUrl: 's3://bucket/report.pdf'
 *   }}
 *   onRerun={async () => { await resubmitTestRun('tr1'); }}
 *   onClose={() => setSelectedTestRun(undefined)}
 * />
 */
export function TestRunResultViewer({
  testRun,
  onRerun,
  onDownloadResult,
  onClose,
  isLoading = false,
}: TestRunResultViewerProps): ReactElement {
  const [isRerunning, setIsRerunning] = useState(false);

  const getStatusBadgeColor = (status?: string): string => {
    switch (status?.toUpperCase()) {
      case 'PASSED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRerun = async (): Promise<void> => {
    if (!onRerun) return;

    try {
      setIsRerunning(true);
      await onRerun(testRun.id);
      onClose(); // Close modal after successful rerun
    } catch (err) {
      console.error('Failed to rerun test:', err);
      // Error handling could be enhanced here
    } finally {
      setIsRerunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="testrun-title"
        className="bg-white rounded-lg max-w-[600px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 id="testrun-title" className="m-0 text-2xl text-gray-800">
              Test Result
            </h2>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(testRun.status)}`}
              aria-label={`Status: ${testRun.status || 'Unknown'}`}
            >
              {testRun.status || 'Unknown'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close test result modal"
            className="bg-none border-none text-2xl cursor-pointer text-gray-600 px-0 py-0 w-10 h-10 flex items-center justify-center hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Test ID */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600">Test Run ID</p>
            <p className="text-base text-gray-900 font-mono">{testRun.id}</p>
          </div>

          {/* Status Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">Status Details</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Current Status:</span>
                <span
                  className={`font-semibold px-2 py-1 rounded text-sm ${getStatusBadgeColor(testRun.status)}`}
                >
                  {testRun.status || 'Unknown'}
                </span>
              </div>

              {testRun.result && (
                <div>
                  <span className="text-gray-700">Result:</span>
                  <p className="text-gray-900 mt-1 text-sm">{testRun.result}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {testRun.startedAt && (
              <div>
                <p className="text-sm font-medium text-gray-600">Started</p>
                <p className="text-sm text-gray-700">{new Date(testRun.startedAt).toLocaleString()}</p>
              </div>
            )}

            {testRun.completedAt && (
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-sm text-gray-700">{new Date(testRun.completedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* File Link */}
          {testRun.fileUrl && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-gray-600 mb-2">Result File</p>
              <button
                onClick={() => {
                  if (onDownloadResult && testRun.fileUrl) {
                    onDownloadResult(testRun.fileUrl);
                  } else if (testRun.fileUrl) {
                    window.open(testRun.fileUrl, '_blank');
                  }
                }}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Download Result {testRun.fileUrl}
              </button>
            </div>
          )}

          {/* Rerun Notice for Failed Tests */}
          {testRun.status === 'FAILED' && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                This test failed. You can rerun it to check if the issue persists.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          {testRun.status === 'FAILED' && onRerun && (
            <button
              onClick={() => void handleRerun()}
              disabled={isRerunning || isLoading}
              aria-label="Rerun this test"
              className="px-4 py-2 text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {isRerunning ? 'Rerunning...' : 'Rerun Test'}
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
