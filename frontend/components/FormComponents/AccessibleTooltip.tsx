'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface AccessibleTooltipProps {
  content: string;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  side = 'top',
  className = '',
}): React.ReactElement => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipId] = useState(() => `tooltip-${Math.random().toString(36).slice(2, 9)}`);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const handleMouseEnter = useCallback((): void => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsVisible(false);
  }, []);

  const handleFocus = useCallback((): void => {
    setIsVisible(true);
  }, []);

  const handleBlur = useCallback((): void => {
    setIsVisible(false);
  }, []);

  const getPositionClasses = (): string => {
    const baseClasses = 'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md whitespace-nowrap pointer-events-none';
    switch (side) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      default:
        return baseClasses;
    }
  };

  const clonedChild = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'aria-describedby': isVisible ? tooltipId : undefined,
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <div ref={triggerRef} className="relative inline-block">
      {clonedChild}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
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
