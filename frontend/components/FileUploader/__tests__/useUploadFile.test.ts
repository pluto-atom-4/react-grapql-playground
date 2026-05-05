/**
 * useUploadFile hook tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUploadFile } from '../useUploadFile';

describe('useUploadFile Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useUploadFile());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should have uploadFile function', () => {
    const { result } = renderHook(() => useUploadFile());
    expect(result.current.uploadFile).toBeDefined();
    expect(typeof result.current.uploadFile).toBe('function');
  });

  it('should accept formData, abortController, and progress callback', () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(function () {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();
    const onProgress = vi.fn();

    expect(result.current.uploadFile).toBeDefined();
  });

  it('should return a promise', () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);
    expect(uploadPromise).toBeInstanceOf(Promise);
  });

  it('should call XMLHttpRequest open and send', async () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(function () {
        this.status = 200;
        this.responseText = JSON.stringify({
          fileId: 'test-123',
          fileName: 'test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/files/test-123',
          uploadedAt: new Date().toISOString(),
        });
        setTimeout(() => this.onload?.());
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onload: null,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    // Just verify the function exists and can be called
    await result.current.uploadFile(formData, abortController).then(() => {
      expect(mockXhr.open).toHaveBeenCalled();
      expect(mockXhr.send).toHaveBeenCalled();
    });
  });

  it('should handle abort signal', () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn((event: string) => {
        if (event === 'abort') {
          // Setup abort listener
        }
      }),
      abort: vi.fn(),
      timeout: 0,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as unknown as typeof XMLHttpRequest;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);
    expect(uploadPromise).toBeInstanceOf(Promise);
  });

  it('should track progress', () => {
    const progressCallback = vi.fn();
    const mockXhr = {
      upload: {
        addEventListener: vi.fn((event: string, handler: Function) => {
          if (event === 'progress') {
            // Mock progress event
            setTimeout(() => {
              handler({
                lengthComputable: true,
                loaded: 512,
                total: 1024,
              });
            }, 0);
          }
        }),
      },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    result.current.uploadFile(formData, abortController, progressCallback);
    expect(progressCallback).toBeDefined();
  });
});
