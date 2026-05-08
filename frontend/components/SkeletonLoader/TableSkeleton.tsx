import type { ReactElement } from 'react';
import { SkeletonPulse } from './SkeletonPulse';

interface TableSkeletonProps {
  rows?: number;
}

/**
 * Table skeleton loader matching BuildDashboard table structure
 *
 * Structure (6 columns):
 * - Name (30%)
 * - Status (20%)
 * - Created (20%)
 * - Action (20%)
 *
 * Features:
 * - Exact height/width matching to prevent CLS
 * - Responsive: fewer columns on mobile (stacked)
 * - Smooth shimmer animation
 * - Fixed skeleton row height (56px per row, matches table row height)
 * - 5 rows by default (placeholder state)
 *
 * Accessibility:
 * - aria-hidden on individual skeletons
 * - aria-busy on table during loading
 */
export function TableSkeleton({ rows = 5 }: TableSkeletonProps): ReactElement {
  return (
    <div className="w-full bg-white shadow-md rounded-lg overflow-hidden" role="status" aria-busy="true" aria-label="Loading builds">
      {/* Table Header */}
      <div className="hidden md:block bg-gray-100 border-b-2 border-gray-300">
        <div className="flex">
          <div className="flex-1 px-4 py-4">
            <SkeletonPulse height="h-4" width="w-20" />
          </div>
          <div className="flex-1 px-4 py-4">
            <SkeletonPulse height="h-4" width="w-16" />
          </div>
          <div className="flex-1 px-4 py-4">
            <SkeletonPulse height="h-4" width="w-20" />
          </div>
          <div className="flex-1 px-4 py-4">
            <SkeletonPulse height="h-4" width="w-16" />
          </div>
        </div>
      </div>

      {/* Table Body Skeleton Rows */}
      <div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="border-b border-gray-200 hover:bg-gray-50 transition-colors flex md:flex-row flex-col"
            style={{ height: '56px' }}
          >
            {/* Mobile: Stacked layout */}
            <div className="md:hidden w-full flex flex-col justify-center px-4 py-3 gap-2">
              <SkeletonPulse height="h-3" width="w-32" />
              <SkeletonPulse height="h-3" width="w-24" />
            </div>

            {/* Desktop: Column layout */}
            <div className="hidden md:flex md:flex-1 px-4 py-4 items-center">
              <SkeletonPulse height="h-4" width="w-40" />
            </div>
            <div className="hidden md:flex md:flex-1 px-4 py-4 items-center">
              <SkeletonPulse height="h-8" width="w-20" className="rounded-full" />
            </div>
            <div className="hidden md:flex md:flex-1 px-4 py-4 items-center">
              <SkeletonPulse height="h-4" width="w-28" />
            </div>
            <div className="hidden md:flex md:flex-1 px-4 py-4 items-center">
              <SkeletonPulse height="h-10" width="w-24" className="rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
