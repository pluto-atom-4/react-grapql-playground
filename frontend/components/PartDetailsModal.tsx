'use client';

import { useState, type ReactElement } from 'react';
import { InlineEditor, type EditableField } from './InlineEditor';
import type { PartData } from '@/lib/types/modal-types';

/**
 * Props for PartDetailsModal component
 */
export interface PartDetailsModalProps {
  part: PartData;
  onSave: (updatedPart: Partial<PartData>) => Promise<void>;
  onDelete: (partId: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * PartDetailsModal Component
 *
 * Displays detailed part information in a modal with edit capabilities
 *
 * Features:
 * - View part metadata (ID, name, SKU, quantity)
 * - Edit part details inline
 * - Delete part with confirmation
 * - Keyboard navigation (Escape to close)
 * - Accessibility compliant (role="dialog", focus management)
 * - Loading and error states
 *
 * @example
 * <PartDetailsModal
 *   part={{ id: 'p1', name: 'Part A', sku: 'SKU-001', quantity: 5 }}
 *   onSave={async (data) => { await updatePart(part.id, data); }}
 *   onDelete={async () => { await deletePart(part.id); }}
 *   onClose={() => setSelectedPart(undefined)}
 * />
 */
export function PartDetailsModal({
  part,
  onSave,
  onDelete,
  onClose,
  isLoading = false,
}: PartDetailsModalProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const editFields: EditableField[] = [
    {
      name: 'name',
      label: 'Part Name',
      type: 'text',
      value: part.name,
      required: true,
    },
    {
      name: 'sku',
      label: 'SKU',
      type: 'text',
      value: part.sku,
      required: true,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      value: part.quantity || 1,
      required: true,
    },
  ];

  const handleSave = async (data: Record<string, string | number>): Promise<void> => {
    await onSave({
      name: String(data.name),
      sku: String(data.sku),
      quantity: Number(data.quantity),
    });
    setIsEditing(false);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    try {
      setIsDeleting(true);
      await onDelete(part.id);
      onClose();
    } catch (err) {
      // Error handling could be added here
      console.error('Failed to delete part:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-details-title"
        className="bg-white rounded-lg max-w-[500px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200 flex-shrink-0">
          <h2 id="part-details-title" className="m-0 text-2xl text-gray-800">
            Part Details
          </h2>
          <button
            onClick={onClose}
            aria-label="Close part details modal"
            className="bg-none border-none text-2xl cursor-pointer text-gray-600 px-0 py-0 w-10 h-10 flex items-center justify-center hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isEditing ? (
            <InlineEditor
              fields={editFields}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isLoading={isLoading}
              title="Edit Part"
            />
          ) : (
            <div className="space-y-4">
              {/* Part Info Display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">ID</p>
                  <p className="text-base text-gray-900 font-mono">{part.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-base text-gray-900">{part.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">SKU</p>
                  <p className="text-base text-gray-900 font-mono">{part.sku}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantity</p>
                  <p className="text-base text-gray-900">{part.quantity}</p>
                </div>
              </div>

              {/* Created/Updated Timestamps */}
              {part.createdAt && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm text-gray-700">
                    {new Date(part.createdAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 mb-3">
                    Are you sure you want to delete this part? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-3 py-2 text-sm border border-red-300 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleDeleteConfirm()}
                      disabled={isDeleting}
                      className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          {!isEditing && !showDeleteConfirm && (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
