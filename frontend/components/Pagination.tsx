'use client';

import type { ReactElement } from 'react';

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalCount: number;
  /** Items per page */
  pageSize: number;
  /** Callback when next page is requested */
  onNextPage: () => void;
  /** Callback when previous page is requested */
  onPreviousPage: () => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Whether next page button is disabled */
  isNextDisabled?: boolean;
  /** Whether previous page button is disabled */
  isPrevDisabled?: boolean;
  /** Optional CSS class for the container */
  className?: string;
}

/**
 * Reusable Pagination UI Component
 *
 * Features:
 * - Page indicator (e.g., "Page 3 of 10")
 * - Previous/Next buttons with proper disabled states
 * - Page size selector (10, 25, 50 per page)
 * - Tailwind CSS styling
 * - Full accessibility support (ARIA labels, keyboard navigation)
 * - Mobile responsive design
 *
 * @example
 * const { currentPage, totalPages, goToNextPage, goToPreviousPage, setPageSize } = useBuilds();
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   totalCount={totalCount}
 *   pageSize={pageSize}
 *   onNextPage={goToNextPage}
 *   onPreviousPage={goToPreviousPage}
 *   onPageSizeChange={setPageSize}
 *   isNextDisabled={!hasNextPage}
 *   isPrevDisabled={!hasPreviousPage}
 * />
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onNextPage,
  onPreviousPage,
  onPageSizeChange,
  isNextDisabled = false,
  isPrevDisabled = false,
  className = '',
}: PaginationProps): ReactElement {
  const pageSizeOptions = [10, 25, 50];

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg ${className}`}
      role="navigation"
      aria-label="Pagination"
      data-testid="pagination"
    >
      {/* Page indicator and info */}
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <span
          className="font-medium"
          data-testid="page-indicator"
          aria-current="page"
        >
          Page {currentPage} of {totalPages}
        </span>
        <span
          className="text-gray-600"
          data-testid="item-count"
          aria-live="polite"
        >
          ({totalCount} total items)
        </span>
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="page-size-select" className="text-sm font-medium text-gray-700">
          Items per page:
        </label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded bg-white text-sm font-medium text-gray-700 cursor-pointer transition-all duration-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-2"
          data-testid="page-size-select"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPreviousPage}
          disabled={isPrevDisabled}
          className="px-4 py-2 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Previous page"
          data-testid="pagination-prev-button"
        >
          Previous
        </button>

        <button
          onClick={onNextPage}
          disabled={isNextDisabled}
          className="px-4 py-2 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Next page"
          data-testid="pagination-next-button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
