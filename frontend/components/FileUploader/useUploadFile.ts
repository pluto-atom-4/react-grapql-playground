/**
 * useUploadFile Hook
 * Custom React hook for handling file uploads via XMLHttpRequest with progress tracking.
 */

import { useState, useCallback } from 'react';
import type { UploadedFile, ProgressEvent } from './types';
import { getUploadEndpoint, RETRY_CONFIG } from './constants';

/**
 * Custom hook for uploading files with progress tracking
 *
 * @returns Object with uploadFile function and loading state
 */
export function useUploadFile(): { uploadFile: (formData: FormData, abortController: AbortController, onProgress?: (progress: ProgressEvent) => void, attempt?: number) => Promise<UploadedFile>; loading: boolean; error: Error | null } {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Uploads a file with progress tracking and retry logic
   *
   * @param formData - FormData containing the file
   * @param abortController - AbortController for cancellation
   * @param onProgress - Callback for progress updates
   * @param attempt - Current retry attempt (internal)
   * @returns Promise resolving to uploaded file metadata
   */
  const uploadFile = useCallback(
    async (
      formData: FormData,
      abortController: AbortController,
      onProgress?: (progress: ProgressEvent) => void,
      attempt: number = 0
    ): Promise<UploadedFile> => {
      setLoading(true);
      setError(null);

      return new Promise<UploadedFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              onProgress({
                loaded: e.loaded,
                total: e.total,
                percentage: Math.round((e.loaded / e.total) * 100),
              });
            }
          });
        }

        // Handle abort
        const abortHandler = (): void => {
          xhr.abort();
        };
        abortController.signal.addEventListener('abort', abortHandler);

        // Handle completion
        xhr.onload = (): void => {
          abortController.signal.removeEventListener('abort', abortHandler);
          setLoading(false);

          if (xhr.status === 200 || xhr.status === 201) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON.parse returns any
              const response: UploadedFile = JSON.parse(xhr.responseText);
              setError(null);
              resolve(response);
            } catch {
              const parseError = new Error('Failed to parse server response');
              setError(parseError);
              reject(parseError);
            }
          } else {
            let errorMessage = `Upload failed with status ${xhr.status}`;
            try {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON.parse returns any
              const errorResponse = JSON.parse(xhr.responseText);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Accessing property of any
              errorMessage = errorResponse.message || errorMessage;
            } catch {
              // Use default error message if response is not JSON
            }

            // Retry on 5xx errors
            if (xhr.status >= 500 && attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
              const delay = Math.min(
                RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt),
                RETRY_CONFIG.MAX_DELAY_MS
              );

              setTimeout(() => {
                uploadFile(formData, abortController, onProgress, attempt + 1)
                  .then(resolve)
                  .catch(reject);
              }, delay);
            } else {
              const error = new Error(errorMessage);
              setError(error);
              reject(error);
            }
          }
        };

        // Handle network errors
        xhr.onerror = (): void => {
          abortController.signal.removeEventListener('abort', abortHandler);
          setLoading(false);

          if (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
            const delay = Math.min(
              RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt),
              RETRY_CONFIG.MAX_DELAY_MS
            );

            setTimeout(() => {
              uploadFile(formData, abortController, onProgress, attempt + 1)
                .then(resolve)
                .catch(reject);
            }, delay);
          } else {
            const error = new Error('Network error occurred during upload');
            setError(error);
            reject(error);
          }
        };

        // Handle abort
        xhr.onabort = (): void => {
          abortController.signal.removeEventListener('abort', abortHandler);
          setLoading(false);

          const error = new Error('Upload cancelled');
          setError(error);
          reject(error);
        };

        // Set timeout
        xhr.timeout = 300000; // 5 minutes

        xhr.ontimeout = (): void => {
          abortController.signal.removeEventListener('abort', abortHandler);
          setLoading(false);

          const error = new Error('Upload timeout');
          setError(error);
          reject(error);
        };

        // Start upload
        const endpoint = getUploadEndpoint();
        xhr.open('POST', endpoint);
        xhr.send(formData);
      });
    },
    []
  );

  return { uploadFile, loading, error };
}
