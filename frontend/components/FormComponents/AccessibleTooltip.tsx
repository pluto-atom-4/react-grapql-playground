'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface AccessibleTooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/**
 * Accessible Tooltip Component
 * 
 * Features:
 * - Shows on hover/focus
 * - Keyboard accessible (Tab to focus, Escape to close)
 * - Screen reader compatible with aria-label and aria-describedby
 * - Optional custom styling
 * - Positioned with arrow pointer
 *
 * @example
 * ```tsx
 * <AccessibleTooltip content="Help text" side="right">
 *   <button>?</button>
 * </AccessibleTooltip>
 * ```
 */
export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  side = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);
  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);

  const getPositionClasses = () => {
    const baseClasses =
      'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md whitespace-nowrap pointer-events-none';
    switch (side) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2 before:absolute before:bottom-0 before:left-1/2 before:transform before:-translate-x-1/2 before:translate-y-full before:border-4 before:border-transparent before:border-t-gray-900`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2 before:absolute before:left-0 before:top-1/2 before:transform before:-translate-x-full before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-gray-900`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2 before:absolute before:top-0 before:left-1/2 before:transform before:-translate-x-1/2 before:-translate-y-full before:border-4 before:border-transparent before:border-b-gray-900`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2 before:absolute before:right-0 before:top-1/2 before:transform before:translate-x-full before:-translate-y-1/2 before:border-4 before:border-transparent before:border-l-gray-900`;
      default:
        return baseClasses;
    }
  };

  const clonedChild = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-describedby': isVisible ? tooltipId.current : undefined,
  } as any);

  return (
    <div ref={triggerRef} className="relative inline-block">
      {clonedChild}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          role="tooltip"
          className={`${getPositionClasses()} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default AccessibleTooltip;
