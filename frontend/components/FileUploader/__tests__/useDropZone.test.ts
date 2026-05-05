/**
 * useDropZone hook tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDropZone } from '../useDropZone';

describe('useDropZone Hook', () => {
  it('should initialize with isDragActive as false', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    expect(result.current.isDragActive).toBe(false);
  });

  it('should provide getRootProps', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    expect(props).toHaveProperty('onDragEnter');
    expect(props).toHaveProperty('onDragLeave');
    expect(props).toHaveProperty('onDrop');
    expect(props).toHaveProperty('onDragOver');
  });

  it('should provide getInputProps', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getInputProps();

    expect(props).toHaveProperty('type', 'file');
    expect(props).toHaveProperty('multiple', true);
    expect(props).toHaveProperty('onChange');
  });

  it('should set isDragActive on drag enter', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dragEvent = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
    }) as any;

    dragEvent.preventDefault = vi.fn();
    dragEvent.stopPropagation = vi.fn();

    props.onDragEnter(dragEvent);

    expect(result.current.isDragActive).toBe(true);
  });

  it('should unset isDragActive on drag leave', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    // First drag enter
    const dragEnterEvent = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
    }) as any;
    dragEnterEvent.preventDefault = vi.fn();
    dragEnterEvent.stopPropagation = vi.fn();
    props.onDragEnter(dragEnterEvent);

    expect(result.current.isDragActive).toBe(true);

    // Then drag leave
    const dragLeaveEvent = new DragEvent('dragleave', {
      bubbles: true,
      cancelable: true,
    }) as any;
    dragLeaveEvent.preventDefault = vi.fn();
    dragLeaveEvent.stopPropagation = vi.fn();
    props.onDragLeave(dragLeaveEvent);

    expect(result.current.isDragActive).toBe(false);
  });

  it('should call onDrop with files on drop', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    }) as any;
    dropEvent.preventDefault = vi.fn();
    dropEvent.stopPropagation = vi.fn();
    dropEvent.dataTransfer = {
      files: [file],
    };

    props.onDrop(dropEvent);

    expect(onDrop).toHaveBeenCalledWith([file]);
    expect(result.current.isDragActive).toBe(false);
  });

  it('should handle file input change', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const inputProps = result.current.getInputProps();

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const changeEvent = {
      target: {
        files: [file],
      },
    } as any;

    inputProps.onChange(changeEvent);

    expect(onDrop).toHaveBeenCalledWith([file]);
  });

  it('should handle multiple files', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    }) as any;
    dropEvent.preventDefault = vi.fn();
    dropEvent.stopPropagation = vi.fn();
    dropEvent.dataTransfer = {
      files: [file1, file2],
    };

    props.onDrop(dropEvent);

    expect(onDrop).toHaveBeenCalledWith([file1, file2]);
  });

  it('should prevent default behavior on drag over', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dragOverEvent = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    }) as any;
    dragOverEvent.preventDefault = vi.fn();
    dragOverEvent.stopPropagation = vi.fn();

    props.onDragOver(dragOverEvent);

    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should not call onDrop with empty file list', () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useDropZone({ onDrop }));
    const props = result.current.getRootProps();

    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
    }) as any;
    dropEvent.preventDefault = vi.fn();
    dropEvent.stopPropagation = vi.fn();
    dropEvent.dataTransfer = {
      files: [],
    };

    props.onDrop(dropEvent);

    expect(onDrop).not.toHaveBeenCalled();
  });
});
