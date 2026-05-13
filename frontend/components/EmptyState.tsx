'use client';

import type { ReactElement } from 'react';

interface EmptyStateProps {
  icon?: ReactElement;
  title: string;
  description: string;
  ctaText?: string;
  onCTA?: () => void;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  loadingText?: string;
  ariaLabel?: string;
}

/**
 * Empty State Component
 *
 * Reusable component for displaying empty states across the application.
 * Shows a centered placeholder with icon, title, description, and optional CTA button.
 *
 * Features:
 * - Responsive design (works on mobile, tablet, desktop)
 * - Optional icon element (pass JSX)
 * - Customizable title and description
 * - Optional call-to-action button
 * - Accessible markup with proper semantic HTML
 *
 * @example
 * <EmptyState
 *   icon={<DocumentIcon />}
 *   title="No builds yet"
 *   description="Create your first build to get started"
 *   ctaText="Create Build"
 *   onCTA={handleCreateBuild}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaText,
  onCTA,
  className = '',
  isLoading = false,
  isDisabled = false,
  loadingText,
  ariaLabel,
}: EmptyStateProps): ReactElement {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}

      <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>

      <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>

      {ctaText && onCTA && (
        <button
          onClick={onCTA}
          disabled={isLoading || isDisabled}
          aria-label={ariaLabel}
          className={`bg-blue-600 hover:bg-blue-700 active:scale-95 focus:ring-2 focus:ring-blue-500 focus:outline-none text-white px-6 py-2 rounded-lg transition-all duration-150 ease-out font-medium ${
            (isLoading || isDisabled) ? 'opacity-60 cursor-not-allowed hover:bg-blue-600' : ''
          }`}
          type="button"
        >
          {isLoading ? (loadingText || `${ctaText}...`) : ctaText}
        </button>
      )}
    </div>
  );
}
