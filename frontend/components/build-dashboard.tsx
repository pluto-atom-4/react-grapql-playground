'use client'

import { useState } from 'react'
import { useBuilds, useCreateBuild } from '@/lib/apollo-hooks'
import BuildDetailModal from './build-detail-modal'
import './build-dashboard.css'

function BuildsTable() {
  const { builds, loading, error, refetch } = useBuilds()
  const { createBuild } = useCreateBuild()
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateBuild = async () => {
    const name = prompt('Enter build name:')
    if (!name) return

    try {
      setIsCreating(true)
      await createBuild(name)
      refetch()
    } catch (err) {
      alert(`Failed to create build: ${err}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading builds...</p></div>
  }

  if (error) {
    return <div className="dashboard-container"><p className="error">Error: {error.message}</p></div>
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
            {builds.map((build: any) => (
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
                    onClick={() => setSelectedBuildId(build.id)}
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
          onClose={() => setSelectedBuildId(null)}
        />
      )}
    </>
  )
}

export default function BuildDashboard() {
  return (
    <div className="dashboard-container">
      <BuildsTable />
    </div>
  )
}
