'use client';

import type { ReactElement, ReactNode } from 'react';
import React from 'react';

/**
 * Props for MetricCard component
 */
export interface MetricCardProps {
  /** Icon to display (React element) */
  icon: ReactNode;
  /** Label for the metric */
  label: string;
  /** Metric value (number or string) */
  value: string | number;
  /** Optional subtext below value */
  subtext?: string;
  /** Optional trend indicator: 'up', 'down', 'neutral' */
  trend?: 'up' | 'down' | 'neutral';
  /** Optional click handler */
  onClick?: () => void;
  /** Optional custom CSS class */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

/**
 * MetricCard Component
 *
 * Displays a single metric with icon, label, and value in a card format.
 * Used in dashboard metrics section and reusable across different contexts.
 *
 * Features:
 * - Icon + label + value layout
 * - Optional trend indicator
 * - Optional subtext
 * - Clickable variant with hover effect
 * - Responsive design (Tailwind CSS)
 * - Accessibility: semantic HTML, ARIA labels, sufficient color contrast
 * - Memoized to prevent unnecessary re-renders
 *
 * @example
 * <MetricCard
 *   icon={<BuildIcon />}
 *   label="Total Builds"
 *   value={42}
 *   subtext="Last 30 days"
 *   trend="up"
 * />
 *
 * @example
 * <MetricCard
 *   icon={<CheckIcon />}
 *   label="Completed"
 *   value={38}
 *   onClick={() => navigate('/builds?status=COMPLETE')}
 * />
 */
function MetricCardComponent({
  icon,
  label,
  value,
  subtext,
  trend,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}: MetricCardProps): ReactElement {
  const isClickable = Boolean(onClick);

  // Base card classes
  const baseClasses = `
    bg-white rounded-lg border border-gray-200 p-6 shadow-sm
    transition-all duration-200
  `;

  // Interactive classes if clickable
  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:border-gray-300 hover:shadow-md active:shadow-sm'
    : '';

  // Trend indicator classes
  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-400',
  };

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={ariaLabel || label}
    >
      {/* Header: Icon and Trend */}
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div className="text-gray-600 text-2xl flex-shrink-0">{icon}</div>

        {/* Trend indicator */}
        {trend && trend !== 'neutral' && (
          <div className={`text-sm font-semibold ${trendClasses[trend]}`}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>

      {/* Value */}
      <p className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
        {value}
      </p>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-gray-500">{subtext}</p>
      )}
    </div>
  );
}

/**
 * Memoized MetricCard to prevent unnecessary re-renders
 * when parent component updates but metric props haven't changed.
 */
export const MetricCard = React.memo(MetricCardComponent);
