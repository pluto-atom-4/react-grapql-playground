'use client'

import { useState } from 'react'
import {
  useBuildDetail,
  useUpdateBuildStatus,
  useAddPart,
  useSubmitTestRun,
} from '@/lib/apollo-hooks'
import './build-detail-modal.css'

function BuildDetailContent({
  buildId,
  onClose,
}: {
  buildId: string
  onClose: () => void
}) {
  const { build, loading, error, refetch } = useBuildDetail(buildId)
  const { updateStatus } = useUpdateBuildStatus()
  const { addPart } = useAddPart()
  const { submitTestRun } = useSubmitTestRun()
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [isSubmittingTestRun, setIsSubmittingTestRun] = useState(false)

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Loading build details...</p>
        </div>
      </div>
    )
  }

  if (error || !build) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p className="error">Failed to load build: {error?.message || 'Unknown error'}</p>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus(buildId, newStatus)
      refetch()
    } catch (error) {
      alert(`Failed to update status: ${error}`)
    }
  }

  const handleAddPart = async () => {
    const name = prompt('Part name:')
    if (!name) return
    const sku = prompt('SKU:')
    if (!sku) return
    const quantity = prompt('Quantity:')
    if (!quantity) return

    try {
      setIsAddingPart(true)
      await addPart(buildId, name, sku, parseInt(quantity))
      refetch()
    } catch (error) {
      alert(`Failed to add part: ${error}`)
    } finally {
      setIsAddingPart(false)
    }
  }

  const handleSubmitTestRun = async () => {
    const status = prompt('Test status (PENDING/RUNNING/PASSED/FAILED):')
    if (!status) return

    try {
      setIsSubmittingTestRun(true)
      await submitTestRun(buildId, status)
      refetch()
    } catch (error) {
      alert(`Failed to submit test run: ${error}`)
    } finally {
      setIsSubmittingTestRun(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{build.name}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <section className="build-info">
            <h3>Build Status</h3>
            <p className={`badge status-${build.status.toLowerCase()}`}>{build.status}</p>
            {build.description && <p>{build.description}</p>}
            <div className="status-controls">
              {['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={build.status === status}
                  className="btn btn-secondary"
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="parts-section">
            <h3>Parts ({build.parts?.length || 0})</h3>
            {build.parts && build.parts.length > 0 ? (
              <table className="parts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {build.parts.map((part: any) => (
                    <tr key={part.id}>
                      <td>{part.name}</td>
                      <td>{part.sku}</td>
                      <td>{part.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">No parts added yet</p>
            )}
            <button
              onClick={handleAddPart}
              disabled={isAddingPart}
              className="btn btn-secondary"
            >
              {isAddingPart ? 'Adding...' : 'Add Part'}
            </button>
          </section>

          <section className="test-runs-section">
            <h3>Test Runs ({build.testRuns?.length || 0})</h3>
            {build.testRuns && build.testRuns.length > 0 ? (
              <table className="test-runs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {build.testRuns.map((run: any) => (
                    <tr key={run.id}>
                      <td>
                        <span className={`badge status-${run.status.toLowerCase()}`}>
                          {run.status}
                        </span>
                      </td>
                      <td>{run.result || '-'}</td>
                      <td>{run.completedAt ? new Date(run.completedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-state">No test runs yet</p>
            )}
            <button
              onClick={handleSubmitTestRun}
              disabled={isSubmittingTestRun}
              className="btn btn-secondary"
            >
              {isSubmittingTestRun ? 'Submitting...' : 'Submit Test Run'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function BuildDetailModal({
  buildId,
  onClose,
}: {
  buildId: string
  onClose: () => void
}) {
  return <BuildDetailContent buildId={buildId} onClose={onClose} />
}
