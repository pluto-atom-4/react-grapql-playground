'use client';

import type { ReactElement } from 'react';
import React, { useState } from 'react';
import type { BuildStatus } from '../lib/generated/graphql';

/**
 * Test run data structure
 */
export interface TestRun {
  id: string;
  buildId: string;
  name: string;
  status: BuildStatus;
  result?: 'PASSED' | 'FAILED';
  duration?: number;
  createdAt?: string;
  passedTests?: number;
  failedTests?: number;
}

/**
 * Props for BuildTestRunsTab
 */
export interface BuildTestRunsTabProps {
  buildId: string;
  testRuns?: TestRun[];
  isLoading?: boolean;
  onTestRunAdded?: (testRun: TestRun) => void;
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
}: BuildTestRunsTabProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRuns = testRuns.filter((run) =>
    run.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getResultColor = (result?: string): string => {
    switch (result) {
      case 'PASSED':
        return 'text-green-700 bg-green-50';
      case 'FAILED':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
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
          placeholder="Search by test name..."
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
              name: '',
              status: 'PENDING' as BuildStatus,
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
                  <p className="font-medium text-gray-900">{run.name}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {run.result && (
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getResultColor(run.result)}`}
                      >
                        {run.result}
                      </span>
                    )}
                    {run.passedTests !== undefined && run.failedTests !== undefined && (
                      <span className="text-xs text-gray-600">
                        {run.passedTests} passed, {run.failedTests} failed
                      </span>
                    )}
                    {run.duration && (
                      <span className="text-xs text-gray-600">Duration: {formatDuration(run.duration)}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                  aria-label={`View test run ${run.name}`}
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
