import type { ReactElement } from 'react';
import { SkeletonPulse } from './SkeletonPulse';

/**
 * Modal skeleton loader matching BuildDetailModal structure
 *
 * Structure:
 * - Header with close button
 * - Build status section with status badge and buttons
 * - Parts section with table preview
 * - Test runs section with table preview
 * - Footer with action buttons
 *
 * Features:
 * - Exact dimensions matching real content to prevent CLS
 * - Responsive design (mobile: narrower, fewer columns)
 * - Smooth shimmer animation
 * - Fixed modal size (700px max-width)
 *
 * Accessibility:
 * - aria-hidden on individual skeletons
 * - role="status" for loading state
 */
export function ModalSkeleton(): ReactElement {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="status"
      aria-busy="true"
      aria-label="Loading build details"
    >
      <div className="bg-white rounded-lg max-w-[700px] w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-6 border-b border-gray-200">
          <div className="flex-1">
            <SkeletonPulse height="h-7" width="w-48" />
          </div>
          <div className="ml-4 w-10 h-10">
            <SkeletonPulse height="h-10" width="w-10" className="rounded" />
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Build Status Section */}
          <section className="pb-4 border-b border-gray-200">
            <SkeletonPulse height="h-6" width="w-32" className="mb-4" />
            <SkeletonPulse height="h-8" width="w-24" className="mb-4 rounded-full" />
            <SkeletonPulse height="h-4" width="w-full" className="mb-2" />
            <SkeletonPulse height="h-4" width="w-5/6" className="mb-6" />

            {/* Status Buttons */}
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonPulse key={i} height="h-10" width="w-24" className="rounded" />
              ))}
            </div>
          </section>

          {/* Parts Section */}
          <section>
            <SkeletonPulse height="h-6" width="w-40" className="mb-4" />
            <div className="space-y-2">
              {/* Table Header */}
              <div className="flex gap-2 pb-2">
                <div className="flex-1">
                  <SkeletonPulse height="h-4" width="w-16" />
                </div>
                <div className="flex-1">
                  <SkeletonPulse height="h-4" width="w-14" />
                </div>
                <div className="flex-1">
                  <SkeletonPulse height="h-4" width="w-12" />
                </div>
              </div>

              {/* Table Rows */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <SkeletonPulse height="h-4" width="w-24" />
                  </div>
                  <div className="flex-1">
                    <SkeletonPulse height="h-4" width="w-20" />
                  </div>
                  <div className="flex-1">
                    <SkeletonPulse height="h-4" width="w-8" />
                  </div>
                </div>
              ))}
            </div>
            <SkeletonPulse height="h-10" width="w-32" className="mt-4 rounded" />
          </section>

          {/* Test Runs Section */}
          <section>
            <SkeletonPulse height="h-6" width="w-40" className="mb-4" />
            <div className="space-y-2">
              {/* Table Header */}
              <div className="flex gap-2 pb-2">
                <div className="flex-1">
                  <SkeletonPulse height="h-4" width="w-20" />
                </div>
                <div className="flex-1">
                  <SkeletonPulse height="h-4" width="w-16" />
                </div>
                <div className="flex-1">
                  <SkeletonPulse height="h-4" width="w-20" />
                </div>
              </div>

              {/* Table Rows */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-2 py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <SkeletonPulse height="h-4" width="w-28" />
                  </div>
                  <div className="flex-1">
                    <SkeletonPulse height="h-6" width="w-16" className="rounded-full" />
                  </div>
                  <div className="flex-1">
                    <SkeletonPulse height="h-4" width="w-24" />
                  </div>
                </div>
              ))}
            </div>
            <SkeletonPulse height="h-10" width="w-32" className="mt-4 rounded" />
          </section>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <SkeletonPulse height="h-10" width="w-24" className="rounded" />
          <SkeletonPulse height="h-10" width="w-24" className="rounded" />
        </div>
      </div>
    </div>
  );
}
