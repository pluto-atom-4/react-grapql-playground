import type { ReactElement } from 'react';

interface SkeletonPulseProps {
  width?: string;
  height?: string;
  className?: string;
}

/**
 * Base skeleton component with shimmer animation
 * Reusable building block for all skeleton loaders
 *
 * Features:
 * - Configurable width/height via Tailwind classes
 * - Smooth shimmer animation using CSS gradient
 * - Prevents CLS by matching exact content dimensions
 * - Accessibility: aria-hidden to hide from screen readers
 * - Enhanced visibility: opacity increased from 0.6 to 0.8
 * - Smooth animation: timing increased from 1.5s to 2s for professional effect
 */
export function SkeletonPulse({
  width = 'w-full',
  height = 'h-4',
  className = '',
}: SkeletonPulseProps): ReactElement {
  return (
    <div
      className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}
