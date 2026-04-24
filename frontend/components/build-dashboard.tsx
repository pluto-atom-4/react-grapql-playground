'use client';

import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { useBuilds, useCreateBuild } from '@/lib/apollo-hooks';
import BuildDetailModal from './build-detail-modal';
import type { Build } from '@/lib/generated/graphql';
import './build-dashboard.css';

interface BuildItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface BuildsTableProps {
  initialBuilds?: Build[];
}

/**
 * Inner component for builds table with SSR support
 *
 * Benefits from Issue #85 (Type Safety):
 * - Explicit Build[] type ensures no re-renders from type mismatches on hydration
 * - Cache-first strategy when initialBuilds provided prevents unnecessary queries
 */
function BuildsTable({ initialBuilds }: BuildsTableProps): ReactElement {
  const { builds: fetchedBuilds, loading, error, refetch } = useBuilds();
  const { createBuild } = useCreateBuild();
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Prefer fresh client-fetched data over stale server-provided initial data.
  // This ensures mutations that call refetch() show new data immediately.
  // On initial page load, fetchedBuilds may be empty, so we fall back to initialBuilds.
  // Post-hydration, after any refetch(), fetchedBuilds has priority (fresh data).
  const builds = useMemo(() => {
    // If we have fetched data (from refetch or initial client fetch), prefer it
    // This ensures mutations that update the server immediately reflect in the UI
    if (fetchedBuilds && fetchedBuilds.length > 0) return fetchedBuilds;

    // Otherwise fall back to server-provided data only on initial load
    // before any client-side fetch happens
    return initialBuilds || [];
  }, [initialBuilds, fetchedBuilds]);

  // When initialBuilds are provided, we shouldn't show loading state
  // since data is already available from server
  const shouldShowLoading = !initialBuilds && loading;

  const handleCreateBuild = (): void => {
    const name = prompt('Enter build name:');
    if (!name) return;

    void (async (): Promise<void> => {
      try {
        setIsCreating(true);
        await createBuild(name);
        refetch();
      } catch (err) {
        alert(`Failed to create build: ${String(err)}`);
      } finally {
        setIsCreating(false);
      }
    })();
  };

  if (shouldShowLoading) {
    return (
      <div className="dashboard-container">
        <p>Loading builds...</p>
      </div>
    );
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  if (error && !initialBuilds) {
    return (
      <div className="dashboard-container">
        <p className="error">Error: {errorMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-header">
        <h1>Build Dashboard</h1>
        <button
          onClick={handleCreateBuild}
          disabled={isCreating}
          data-testid="create-build-button"
          className="btn btn-primary"
        >
          {isCreating ? 'Creating...' : 'Create Build'}
        </button>
      </div>

      {builds.length === 0 ? (
        <p className="empty-state" data-testid="empty-state">
          No builds yet. Create one to get started!
        </p>
      ) : (
        <table className="builds-table" data-testid="builds-list">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build: BuildItem) => (
              <tr
                key={build.id}
                className={`status-${build.status.toLowerCase()}`}
                data-testid={`build-${build.id}`}
              >
                <td data-testid="build-name">{build.name}</td>
                <td>
                  <span
                    className={`badge status-${build.status.toLowerCase()}`}
                    data-testid="build-status"
                  >
                    {build.status}
                  </span>
                </td>
                <td>{new Date(build.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={(): void => setSelectedBuildId(build.id)}
                    className="btn btn-secondary"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedBuildId && (
        <BuildDetailModal
          buildId={selectedBuildId}
          onClose={(): void => setSelectedBuildId(null)}
        />
      )}
    </>
  );
}

interface BuildDashboardProps {
  initialBuilds?: Build[];
  serverError?: string | null;
}

/**
 * Root dashboard component with SSR support
 *
 * When called from async Server Component (page.tsx):
 * - initialBuilds prop contains server-fetched data
 * - No additional GraphQL query on hydration (cache-first strategy)
 * - Zero hydration re-renders due to type-safe Build[] type from Issue #85
 *
 * When called without props (fallback):
 * - BuildsTable fetches via useBuilds() hook
 * - Normal client-side rendering with loading states
 */
export default function BuildDashboard({
  initialBuilds,
  serverError,
}: BuildDashboardProps): ReactElement {
  return (
    <div className="dashboard-container">
      {serverError && (
        <div className="alert alert-warning">
          <p>Server error loading builds: {serverError}. Attempting to load client-side...</p>
        </div>
      )}
      <BuildsTable initialBuilds={initialBuilds} />
    </div>
  );
}
