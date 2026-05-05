/**
 * useUploadFile hook tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

  it('should handle successful upload', async () => {
    // Mock XMLHttpRequest
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
        this.onload?.();
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);

    await waitFor(() => {
      expect(uploadPromise).resolves.toBeDefined();
    });
  });

  it('should handle upload error', async () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(function () {
        this.status = 400;
        this.responseText = JSON.stringify({
          error: 'INVALID_FILE',
          message: 'Invalid file type',
        });
        this.onload?.();
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);

    await waitFor(() => {
      expect(uploadPromise).rejects.toBeDefined();
    });
  });

  it('should handle network error', async () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onerror: null as any,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);

    // Simulate network error
    setTimeout(() => {
      if (mockXhr.onerror) {
        mockXhr.onerror();
      }
    }, 10);

    await waitFor(() => {
      expect(uploadPromise).rejects.toBeDefined();
    });
  });

  it('should track upload progress', async () => {
    const progressCallback = vi.fn();
    const mockXhr = {
      upload: {
        addEventListener: vi.fn((event: string, handler: Function) => {
          if (event === 'progress') {
            handler({
              lengthComputable: true,
              loaded: 512,
              total: 1024,
            });
          }
        }),
      },
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
        this.onload?.();
      }),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    await result.current.uploadFile(formData, abortController, progressCallback);

    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        loaded: 512,
        total: 1024,
        percentage: 50,
      })
    );
  });

  it('should handle abort', async () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
      abort: vi.fn(),
      timeout: 0,
      onabort: null as any,
    };

    global.XMLHttpRequest = vi.fn(() => mockXhr) as any;

    const { result } = renderHook(() => useUploadFile());
    const formData = new FormData();
    const abortController = new AbortController();

    const uploadPromise = result.current.uploadFile(formData, abortController);

    // Abort the upload
    setTimeout(() => {
      abortController.abort();
      if (mockXhr.onabort) {
        mockXhr.onabort();
      }
    }, 10);

    await waitFor(() => {
      expect(uploadPromise).rejects.toThrow('Upload cancelled');
    });
  });

  it('should set loading state during upload', () => {
    const mockXhr = {
      upload: { addEventListener: vi.fn() },
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

    result.current.uploadFile(formData, abortController);

    // Loading should be true during upload
    expect(result.current.loading).toBe(true);
  });
});
