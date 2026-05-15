'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

/**
 * Test run data structure
 */
export interface TestRun {
  id: string;
  buildId: string;
  status: string;
  result?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  fileUrl?: string | null;
}

/**
 * Props for BuildTestRunsTab
 */
export interface BuildTestRunsTabProps {
  buildId: string;
  testRuns?: TestRun[];
  isLoading?: boolean;
  onTestRunAdded?: (testRun: TestRun) => void;
  onTestRunDrillDown?: (testRunId: string) => void;
}

/**
 * BuildTestRunsTab Component
 *
 * Displays test runs list with search and add test run action
 */
export function BuildTestRunsTab({
  buildId,
  testRuns = [],
  isLoading = false,
  onTestRunAdded,
  onTestRunDrillDown,
}: BuildTestRunsTabProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRuns = testRuns.filter((run) =>
    run.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getResultColor = (result?: string | null): string => {
    switch (result) {
      case 'PASSED':
        return 'text-green-700 bg-green-50';
      case 'FAILED':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-900';
      case 'running':
        return 'bg-cyan-100 text-cyan-900';
      case 'passed':
        return 'bg-green-100 text-green-900';
      case 'failed':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div>
        <input
          type="text"
          placeholder="Search by test ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search test runs"
        />
      </div>

      {/* Add Test Run button */}
      <div>
        <button
          type="button"
          onClick={() =>
            onTestRunAdded?.({
              id: '',
              buildId,
              status: 'PENDING',
            })
          }
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Test Run
        </button>
      </div>

      {/* Test runs list */}
      {filteredRuns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm font-medium">No test runs found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Add a test run to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRuns.map((run) => (
            <div
              key={run.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 font-mono text-sm">{run.id}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                    {run.result && (
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getResultColor(run.result)}`}>
                        {run.result}
                      </span>
                    )}
                    {run.completedAt && (
                      <span className="text-xs text-gray-600">{new Date(run.completedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTestRunDrillDown?.(run.id)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                  aria-label={`View test run ${run.id}`}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
