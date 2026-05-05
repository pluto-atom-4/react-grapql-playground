/**
 * useDropZone Hook
 * Custom React hook for handling drag-and-drop file uploads using native HTML5 API.
 * No external dependencies required.
 */

import { useState, useCallback } from 'react';
import type { DropZoneReturn } from './types';

interface UseDropZoneOptions {
  onDrop: (files: File[]) => void | Promise<void>;
}

interface RootPropsReturn {
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Custom hook for drag-and-drop file handling
 * Provides drag state management and event handlers for drop zones.
 *
 * @param options - Configuration object with onDrop callback
 * @returns Object with drag state and handler getters
 */
export function useDropZone({ onDrop }: UseDropZoneOptions): DropZoneReturn {
  const [isDragActive, setIsDragActive] = useState(false);

  /**
   * Handles drag enter event
   */
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  /**
   * Handles drop event - extracts files and calls onDrop callback
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      // Extract files from dataTransfer
      const files = Array.from(e.dataTransfer.files || []);

      // Call onDrop callback with files
      if (files.length > 0) {
        // Handle both sync and async onDrop callbacks
        const result = onDrop(files);
        if (result instanceof Promise) {
          result.catch(() => {
            // Silently handle promise rejection
          });
        }
      }
    },
    [onDrop]
  );

  /**
   * Handles drag over event - required to allow drop
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Returns props to spread on drop zone container
   */
  const getRootProps = useCallback(
    (): RootPropsReturn => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragOver: handleDragOver,
    }),
    [handleDragEnter, handleDragLeave, handleDrop, handleDragOver]
  );

  /**
   * Returns props to spread on file input element
   */
  const getInputProps = useCallback(
    () => ({
      type: 'file' as const,
      multiple: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          const files = Array.from(e.target.files);
          onDrop(files);
        }
      },
    }),
    [onDrop]
  );

  return {
    isDragActive,
    getRootProps,
    getInputProps,
  };
}
