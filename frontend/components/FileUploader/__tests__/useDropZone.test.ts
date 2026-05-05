/**
 * useDropZone hook tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useDropZone } from '../useDropZone';

// Mock DragEvent for test environment
class MockDragEvent extends Event {
  dataTransfer: { files: File[] };

  constructor(type: string, init?: EventInit & { dataTransfer?: { files: File[] } }) {
    super(type, init);
    this.dataTransfer = init?.dataTransfer || {
      files: [],
    };
  }

  preventDefault(): void {
    super.preventDefault();
  }

  stopPropagation(): void {
    super.stopPropagation();
  }
}

// Helper function to create properly typed drag events for testing
function createMockDragEvent(
  type: string,
  files: File[] = []
): React.DragEvent<HTMLDivElement> {
  const event = new MockDragEvent(type, { dataTransfer: { files } });
  event.preventDefault = vi.fn();
  event.stopPropagation = vi.fn();
  return event as unknown as React.DragEvent<HTMLDivElement>;
}

describe('useDropZone Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with isDragActive as false', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    expect(result.current.isDragActive).toBe(false);
  });

  it('should provide getRootProps function', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const getRootProps = result.current.getRootProps;

    expect(typeof getRootProps).toBe('function');
    const props = getRootProps();
    expect(props).toHaveProperty('onDragEnter');
    expect(props).toHaveProperty('onDragLeave');
    expect(props).toHaveProperty('onDrop');
    expect(props).toHaveProperty('onDragOver');
  });

  it('should provide getInputProps function', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const getInputProps = result.current.getInputProps;

    expect(typeof getInputProps).toBe('function');
    const props = getInputProps();
    expect(props.type).toBe('file');
    expect(props.multiple).toBe(true);
    expect(props).toHaveProperty('onChange');
  });

  it('should call onDrop callback with files from drop event', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const dropEvent = createMockDragEvent('drop', [file]);

    props.onDrop(dropEvent);

    expect(onDrop).toHaveBeenCalledWith([file]);
  });

  it('should call onDrop with multiple files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
    const dropEvent = createMockDragEvent('drop', [file1, file2]);

    props.onDrop(dropEvent);

    expect(onDrop).toHaveBeenCalledWith([file1, file2]);
  });

  it('should call onDrop with files from file input change', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const inputProps = result.current.getInputProps();

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const changeEvent = {
      target: {
        files: [file],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    inputProps.onChange(changeEvent);

    expect(onDrop).toHaveBeenCalledWith([file]);
  });

  it('should prevent default behavior on drag over', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dragOverEvent = createMockDragEvent('dragover');
    props.onDragOver(dragOverEvent);

    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not call onDrop with empty file list', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dropEvent = createMockDragEvent('drop', []);

    props.onDrop(dropEvent);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it('should handle drag enter event', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dragEvent = createMockDragEvent('dragenter');

    // Just verify it can be called without errors
    expect(() => props.onDragEnter(dragEvent)).not.toThrow();
  });

  it('should handle drag leave event', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dragEvent = createMockDragEvent('dragleave');

    // Just verify it can be called without errors
    expect(() => props.onDragLeave(dragEvent)).not.toThrow();
  });
});
