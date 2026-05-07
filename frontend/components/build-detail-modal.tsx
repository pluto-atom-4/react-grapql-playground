'use client';

import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import {
  useBuildDetail,
  useUpdateBuildStatus,
  useAddPart,
  useSubmitTestRun,
  BuildStatus,
  TestStatus,
} from '@/lib/apollo-hooks';
import { useTestRuns } from '@/lib/hooks/useTestRuns';
import type { TestRun } from '@/lib/generated/graphql';
import { TestRunDetailsPanel } from './test-run-details-panel';
import { useToast } from '@/lib/error-notifier';

interface Part {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface BuildData {
  id: string;
  name: string;
  status: string;
  description?: string;
  parts?: Part[];
  testRuns?: TestRun[];
}

function BuildDetailContent({
  buildId,
  onClose,
}: {
  buildId: string;
  onClose: () => void;
}): ReactElement {
  const toast = useToast();
  const { build, loading, error } = useBuildDetail(buildId);
  const { updateStatus } = useUpdateBuildStatus();
  const { addPart } = useAddPart();
  const { submitTestRun } = useSubmitTestRun();
  
  // Polling hook for real-time test run updates
  const { 
    testRuns, 
    error: testRunsError, 
    startPolling, 
    stopPolling, 
    isPolling, 
    refetch: refetchTestRuns 
  } = useTestRuns(buildId);
  
  // State for selected test run (to show details panel)
  const [selectedTestRunId, setSelectedTestRunId] = useState<string | null>(null);
  
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [isSubmittingTestRun, setIsSubmittingTestRun] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Start polling when modal opens, stop when closes
  useEffect(() => {
    startPolling(2000); // Poll every 2 seconds

    return (): void => {
      stopPolling(); // Cleanup on unmount
    };
  }, [buildId, startPolling, stopPolling]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-[700px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e): void => e.stopPropagation()}>
          <p>Loading build details...</p>
        </div>
      </div>
    );
  }

  if (error || !build) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as Record<string, unknown>).message)
        : 'Unknown error';
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg max-w-[700px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e): void => e.stopPropagation()}>
          <p className="text-red-600 px-4 py-4 bg-red-100 border border-red-400 rounded">Failed to load build: {errorMessage}</p>
          <button onClick={onClose} className="px-5 py-2.5 border-0 rounded bg-blue-600 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-blue-800">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string): void => {
    const validStatuses = [
      BuildStatus.Pending,
      BuildStatus.Running,
      BuildStatus.Complete,
      BuildStatus.Failed,
    ];
    if (!validStatuses.includes(newStatus as BuildStatus)) {
      toast.warning(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      return;
    }

    void (async (): Promise<void> => {
      try {
        setIsUpdatingStatus(true);
        await updateStatus(buildId, newStatus as BuildStatus);
        toast.success(`Build status updated to ${newStatus}`);
        // ✅ Don't call refetch()—Apollo cache already updated optimistically
      } catch (error) {
        const message = typeof error === 'string' ? error : String(error);
        toast.error(`Failed to update status: ${message}`);
      } finally {
        setIsUpdatingStatus(false);
      }
    })();
  };

  const handleAddPart = (): void => {
    const name = prompt('Part name:');
    if (!name) return;
    const sku = prompt('SKU:');
    if (!sku) return;
    const quantityStr = prompt('Quantity:');
    if (!quantityStr) return;

    void (async (): Promise<void> => {
      try {
        setIsAddingPart(true);
        await addPart(buildId, name, sku, parseInt(quantityStr, 10));
        toast.success('Part added successfully');
        // ✅ Don't call refetch()—Apollo cache already updated optimistically
      } catch (error) {
        const message = typeof error === 'string' ? error : String(error);
        toast.error(`Failed to add part: ${message}`);
      } finally {
        setIsAddingPart(false);
      }
    })();
  };

  const handleSubmitTestRun = (): void => {
    const status = prompt('Test status (PENDING/RUNNING/PASSED/FAILED):');
    if (!status) return;

    const validStatuses = [
      TestStatus.Pending,
      TestStatus.Running,
      TestStatus.Passed,
      TestStatus.Failed,
    ];
    if (!validStatuses.includes(status as TestStatus)) {
      toast.warning(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      return;
    }

    void (async (): Promise<void> => {
      try {
        setIsSubmittingTestRun(true);
        await submitTestRun(buildId, status as TestStatus);
        toast.success('Test run submitted successfully');
        // ✅ Don't call refetch()—Apollo cache already updated optimistically
      } catch (error) {
        const message = typeof error === 'string' ? error : String(error);
        toast.error(`Failed to submit test run: ${message}`);
      } finally {
        setIsSubmittingTestRun(false);
      }
    })();
  };

  const buildData = build as BuildData;

  // Show details panel OR table view based on selectedTestRunId
  if (selectedTestRunId) {
    return (
      <TestRunDetailsPanel
        buildId={buildId}
        testRunId={selectedTestRunId}
        onClose={() => setSelectedTestRunId(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-[700px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e): void => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200">
          <h2 className="m-0 text-2xl text-gray-800">{buildData.name}</h2>
          <button onClick={onClose} className="bg-none border-none text-2xl cursor-pointer text-gray-600 px-0 py-0 w-10 h-10 flex items-center justify-center hover:text-gray-800">
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          <section className="pb-4 border-b border-gray-200">
            <h3 className="mt-0 mb-4 text-lg text-gray-800">Build Status</h3>
            <p className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              buildData.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-900' :
              buildData.status.toLowerCase() === 'running' ? 'bg-cyan-100 text-cyan-900' :
              buildData.status.toLowerCase() === 'complete' ? 'bg-green-100 text-green-900' :
              'bg-red-100 text-red-900'
            }`}>{buildData.status}</p>
            {buildData.description && <p>{buildData.description}</p>}
            <div className="flex gap-2 mt-4 flex-wrap">
              {['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'].map((status) => (
                <button
                  key={status}
                  onClick={(): void => handleStatusChange(status)}
                  disabled={isUpdatingStatus || buildData.status === status}
                  className="px-4 py-2 border-0 rounded bg-gray-600 text-white font-medium text-sm cursor-pointer transition-all duration-200 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="mt-0 mb-4 text-lg text-gray-800">Parts ({buildData.parts?.length || 0})</h3>
            {buildData.parts && buildData.parts.length > 0 ? (
              <table className="w-full border-collapse mb-4 bg-gray-50 rounded overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Name</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">SKU</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {buildData.parts.map((part: Part) => (
                    <tr key={part.id} className="hover:bg-gray-100">
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">{part.name}</td>
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">{part.sku}</td>
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">{part.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-8 text-gray-600">No parts added yet</p>
            )}
            <button onClick={handleAddPart} disabled={isAddingPart} className="w-full text-center px-4 py-2 border-0 rounded bg-gray-600 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed">
              {isAddingPart ? 'Adding...' : 'Add Part'}
            </button>
          </section>

          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0">Test Runs ({testRuns?.length || 0})</h3>
              {/* Polling indicator */}
              {isPolling && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded text-sm text-blue-700" data-testid="polling-indicator">
                  <span className="inline-block animate-pulse text-base">●</span>
                  <span className="font-medium">Live Updates</span>
                </div>
              )}
            </div>

            {/* Show polling error if it occurs */}
            {testRunsError && (
              <div className="flex justify-between items-center gap-4 mb-4 px-4 py-4 bg-yellow-100 border border-yellow-400 rounded" data-testid="polling-error">
                <p>Failed to fetch test run updates. Retrying...</p>
                <button onClick={() => void refetchTestRuns()} className="px-4 py-2 border-0 rounded bg-gray-600 text-white font-medium text-sm cursor-pointer transition-all duration-200 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
                  Retry Now
                </button>
              </div>
            )}

            {/* Test runs table with clickable rows */}
            {testRuns && testRuns.length > 0 ? (
              <table className="w-full border-collapse mb-4 bg-gray-50 rounded overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Status</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Result</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {testRuns.map((run: TestRun) => (
                    <tr
                      key={run.id}
                      onClick={() => setSelectedTestRunId(run.id)}
                      data-testid={`test-run-${run.id}`}
                      className="cursor-pointer transition-colors duration-200 hover:bg-cyan-50"
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedTestRunId(run.id);
                        }
                      }}
                      aria-label={`View details for test run ${run.id}`}
                    >
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                          run.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-900' :
                          run.status.toLowerCase() === 'running' ? 'bg-cyan-100 text-cyan-900' :
                          run.status.toLowerCase() === 'passed' ? 'bg-green-100 text-green-900' :
                          'bg-red-100 text-red-900'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">{run.result || '-'}</td>
                      <td className="px-3 py-3 border-b border-gray-200 text-sm">{run.completedAt ? new Date(run.completedAt as string).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-8 text-gray-600">No test runs yet</p>
            )}

            <button
              onClick={handleSubmitTestRun}
              disabled={isSubmittingTestRun}
              className="w-full text-center px-4 py-2 border-0 rounded bg-gray-600 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingTestRun ? 'Submitting...' : 'Submit Test Run'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function BuildDetailModal({
  buildId,
  onClose,
}: {
  buildId: string;
  onClose: () => void;
}): ReactElement {
  return <BuildDetailContent buildId={buildId} onClose={onClose} />;
}
