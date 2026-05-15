'use client';

import type { ReactElement } from 'react';
import { StatusBadge } from './StatusBadge';
import type { BuildStatus } from '../lib/generated/graphql';

/**
 * Build data structure
 */
export interface BuildData {
  id: string;
  name: string;
  description?: string;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
  owner?: string;
  version?: string;
  tags?: string[];
}

/**
 * Props for BuildOverviewTab
 */
export interface BuildOverviewTabProps {
  buildId: string;
  build?: BuildData;
  isLoading?: boolean;
  onUpdate?: () => void;
}

/**
 * BuildOverviewTab Component
 *
 * Displays build metadata and quick actions
 */
export function BuildOverviewTab({
  buildId: _buildId,
  build,
  isLoading = false,
  onUpdate,
}: BuildOverviewTabProps): ReactElement {
  if (isLoading || !build) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Build ID and Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Build ID</label>
        <div className="text-gray-900 font-mono text-sm">{build.id}</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Name</label>
        <div className="text-gray-900">{build.name}</div>
      </div>

      {/* Description */}
      {build.description && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <div className="text-gray-900 text-sm leading-relaxed">{build.description}</div>
        </div>
      )}

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <StatusBadge status={build.status} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Created</label>
          <div className="text-gray-600 text-sm">{formatDate(build.createdAt)}</div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Updated</label>
          <div className="text-gray-600 text-sm">{formatDate(build.updatedAt)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onUpdate}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Edit Build
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
