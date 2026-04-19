'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import {
  useBuildDetail,
  useUpdateBuildStatus,
  useAddPart,
  useSubmitTestRun,
  BuildStatus,
  TestStatus,
} from '@/lib/apollo-hooks'
import './build-detail-modal.css'

interface Part {
  id: string
  name: string
  sku: string
  quantity: number
}

interface TestRun {
  id: string
  status: string
  result?: string
  completedAt?: string
}

interface BuildData {
  id: string
  name: string
  status: string
  description?: string
  parts?: Part[]
  testRuns?: TestRun[]
}

function BuildDetailContent({
  buildId,
  onClose,
}: {
  buildId: string
  onClose: () => void
}): ReactElement {
  const { build, loading, error, refetch } = useBuildDetail(buildId)
  const { updateStatus } = useUpdateBuildStatus()
  const { addPart } = useAddPart()
  const { submitTestRun } = useSubmitTestRun()
  const [isAddingPart, setIsAddingPart] = useState(false)
  const [isSubmittingTestRun, setIsSubmittingTestRun] = useState(false)

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e): void => e.stopPropagation()}>
          <p>Loading build details...</p>
        </div>
      </div>
    )
  }

  if (error || !build) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
      ? String((error as Record<string, unknown>).message) 
      : 'Unknown error'
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e): void => e.stopPropagation()}>
          <p className="error">Failed to load build: {errorMessage}</p>
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleStatusChange = (newStatus: string): void => {
    const validStatuses = [BuildStatus.Pending, BuildStatus.Running, BuildStatus.Complete, BuildStatus.Failed]
    if (!validStatuses.includes(newStatus as BuildStatus)) {
      alert(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      return
    }

    void (async (): Promise<void> => {
      try {
        await updateStatus(buildId, newStatus as BuildStatus)
        refetch()
      } catch (error) {
        alert(`Failed to update status: ${String(error)}`)
      }
    })()
  }

  const handleAddPart = (): void => {
    const name = prompt('Part name:')
    if (!name) return
    const sku = prompt('SKU:')
    if (!sku) return
    const quantityStr = prompt('Quantity:')
    if (!quantityStr) return

    void (async (): Promise<void> => {
      try {
        setIsAddingPart(true)
        await addPart(buildId, name, sku, parseInt(quantityStr, 10))
        refetch()
      } catch (error) {
        alert(`Failed to add part: ${String(error)}`)
      } finally {
        setIsAddingPart(false)
      }
    })()
  }

  const handleSubmitTestRun = (): void => {
    const status = prompt('Test status (PENDING/RUNNING/PASSED/FAILED):')
    if (!status) return

    const validStatuses = [TestStatus.Pending, TestStatus.Running, TestStatus.Passed, TestStatus.Failed]
    if (!validStatuses.includes(status as TestStatus)) {
      alert(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      return
    }

    void (async (): Promise<void> => {
      try {
        setIsSubmittingTestRun(true)
        await submitTestRun(buildId, status as TestStatus)
        refetch()
      } catch (error) {
        alert(`Failed to submit test run: ${String(error)}`)
      } finally {
        setIsSubmittingTestRun(false)
      }
    })()
  }

  const buildData = build as BuildData

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e): void => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{buildData.name}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <section className="build-info">
            <h3>Build Status</h3>
            <p className={`badge status-${buildData.status.toLowerCase()}`}>{buildData.status}</p>
            {buildData.description && <p>{buildData.description}</p>}
            <div className="status-controls">
              {['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'].map((status) => (
                <button
                  key={status}
                  onClick={(): void => handleStatusChange(status)}
                  disabled={buildData.status === status}
                  className="btn btn-secondary"
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="parts-section">
            <h3>Parts ({buildData.parts?.length || 0})</h3>
            {buildData.parts && buildData.parts.length > 0 ? (
              <table className="parts-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {buildData.parts.map((part: Part) => (
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
            <h3>Test Runs ({buildData.testRuns?.length || 0})</h3>
            {buildData.testRuns && buildData.testRuns.length > 0 ? (
              <table className="test-runs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {buildData.testRuns.map((run: TestRun) => (
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
}): ReactElement {
  return <BuildDetailContent buildId={buildId} onClose={onClose} />
}
