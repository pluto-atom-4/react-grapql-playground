'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * State for tracking interaction with an element
 */
export interface InteractionState {
  isFocused: boolean;
  isHovered: boolean;
  isActive: boolean;
  isKeyboardInteraction: boolean;
}

/**
 * Return type for useInteractionState hook
 */
export interface InteractionStateHandlers extends InteractionState {
  onFocus: () => void;
  onBlur: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onKeyUp: (e: React.KeyboardEvent) => void;
}

/**
 * Custom hook for managing focus/hover states with keyboard interaction detection
 * 
 * Helps components track:
 * - Focus state (for keyboard navigation)
 * - Hover state (for mouse interactions)
 * - Active state (for click/press interactions)
 * - Keyboard interaction detection (distinguishing keyboard vs mouse focus)
 * 
 * @example
 * const { isFocused, isHovered, isActive, isKeyboardInteraction, ...handlers } = useInteractionState();
 * 
 * return (
 *   <button
 *     onFocus={handlers.onFocus}
 *     onBlur={handlers.onBlur}
 *     onMouseEnter={handlers.onMouseEnter}
 *     onMouseLeave={handlers.onMouseLeave}
 *     onMouseDown={handlers.onMouseDown}
 *     onMouseUp={handlers.onMouseUp}
 *     className={`${isFocused ? 'ring-2 ring-blue-500' : ''} ${isHovered ? 'shadow-md' : ''}`}
 *   >
 *     Click me
 *   </button>
 * );
 */
export function useInteractionState(): InteractionStateHandlers {
  const [state, setState] = useState<InteractionState>({
    isFocused: false,
    isHovered: false,
    isActive: false,
    isKeyboardInteraction: false,
  });

  const lastInteractionTypeRef = useRef<'keyboard' | 'mouse' | null>(null);

  // Detect keyboard focus
  const handleFocus = useCallback(() => {
    // Check if focus was triggered by keyboard (vs mouse)
    // Window.event is not available in all browsers, so we use a timing heuristic
    const isKeyboardFocus = lastInteractionTypeRef.current === 'keyboard';
    
    setState((prev) => ({
      ...prev,
      isFocused: true,
      isKeyboardInteraction: isKeyboardFocus,
    }));
  }, []);

  // Clear focus state
  const handleBlur = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isFocused: false,
      isKeyboardInteraction: false,
    }));
    lastInteractionTypeRef.current = null;
  }, []);

  // Set hover state
  const handleMouseEnter = useCallback(() => {
    lastInteractionTypeRef.current = 'mouse';
    setState((prev) => ({
      ...prev,
      isHovered: true,
    }));
  }, []);

  // Clear hover state
  const handleMouseLeave = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isHovered: false,
    }));
  }, []);

  // Set active state
  const handleMouseDown = useCallback(() => {
    lastInteractionTypeRef.current = 'mouse';
    setState((prev) => ({
      ...prev,
      isActive: true,
    }));
  }, []);

  // Clear active state
  const handleMouseUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  // Handle keyboard interaction
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Detect keyboard focus for tab key and other navigation keys
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
      lastInteractionTypeRef.current = 'keyboard';
      setState((prev) => ({
        ...prev,
        isKeyboardInteraction: true,
      }));
    }

    // Set active state for Enter and Space (common for buttons)
    if (e.key === 'Enter' || e.key === ' ') {
      setState((prev) => ({
        ...prev,
        isActive: true,
      }));
    }
  }, []);

  // Clear active state on key up
  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setState((prev) => ({
        ...prev,
        isActive: false,
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lastInteractionTypeRef.current = null;
    };
  }, []);

  return {
    ...state,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
  };
}
