'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { useBuilds, useCreateBuild } from '@/lib/apollo-hooks'
import BuildDetailModal from './build-detail-modal'
import './build-dashboard.css'

interface BuildItem {
  id: string
  name: string
  status: string
  createdAt: string
}

function BuildsTable(): ReactElement {
  const { builds, loading, error, refetch } = useBuilds()
  const { createBuild } = useCreateBuild()
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateBuild = (): void => {
    const name = prompt('Enter build name:')
    if (!name) return

    void (async (): Promise<void> => {
      try {
        setIsCreating(true)
        await createBuild(name)
        refetch()
      } catch (err) {
        alert(`Failed to create build: ${String(err)}`)
      } finally {
        setIsCreating(false)
      }
    })()
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading builds...</p></div>
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  if (error) {
    return <div className="dashboard-container"><p className="error">Error: {errorMessage}</p></div>
  }

  return (
    <>
      <div className="dashboard-header">
        <h1>Build Dashboard</h1>
        <button
          onClick={handleCreateBuild}
          disabled={isCreating}
          className="btn btn-primary"
        >
          {isCreating ? 'Creating...' : 'Create Build'}
        </button>
      </div>

      {builds.length === 0 ? (
        <p className="empty-state">No builds yet. Create one to get started!</p>
      ) : (
        <table className="builds-table">
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
              <tr key={build.id} className={`status-${build.status.toLowerCase()}`}>
                <td>{build.name}</td>
                <td>
                  <span className={`badge status-${build.status.toLowerCase()}`}>
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
  )
}

export default function BuildDashboard(): ReactElement {
  return (
    <div className="dashboard-container">
      <BuildsTable />
    </div>
  )
}
