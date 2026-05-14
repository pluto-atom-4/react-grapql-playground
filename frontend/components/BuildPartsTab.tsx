'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

/**
 * Part data structure
 */
export interface Part {
  id: string;
  buildId: string;
  name: string;
  sku: string;
  quantity: number;
  status?: string;
  createdAt?: string;
}

/**
 * Props for BuildPartsTab
 */
export interface BuildPartsTabProps {
  buildId: string;
  parts?: Part[];
  isLoading?: boolean;
  onPartAdded?: (part: Part) => void;
  onPartRemoved?: (partId: string) => void;
}

/**
 * BuildPartsTab Component
 *
 * Displays parts list with search and add/remove actions
 */
export function BuildPartsTab({
  buildId,
  parts = [],
  isLoading = false,
  onPartAdded,
  onPartRemoved,
}: BuildPartsTabProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParts = parts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search parts"
        />
      </div>

      {/* Add Part button */}
      <div>
        <button
          type="button"
          onClick={() => onPartAdded?.({ id: '', buildId, name: '', sku: '', quantity: 0 })}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Part
        </button>
      </div>

      {/* Parts list */}
      {filteredParts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm font-medium">No parts found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Add a part to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredParts.map((part) => (
            <div
              key={part.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{part.name}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-600">
                  <span>SKU: {part.sku}</span>
                  <span>Qty: {part.quantity}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPartRemoved?.(part.id)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors"
                aria-label={`Remove part ${part.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
