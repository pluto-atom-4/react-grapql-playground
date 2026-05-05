/**
 * FileUploader Component
 * Main component for drag-and-drop file uploads with progress tracking and error handling.
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import FileUploadProgress from './FileUploadProgress';
import { useUploadFile } from './useUploadFile';
import { useDropZone } from './useDropZone';
import { validateFiles, formatFileSize, createFormData } from './utils';
import type { FileUploaderProps, FileUploadStatus, UploadedFile, ProgressEvent } from './types';

/**
 * FileUploader Component
 * A drag-and-drop file upload component with progress tracking, validation, and error handling.
 *
 * Features:
 * - Drag-and-drop support
 * - File input selection
 * - File validation (type, size, count)
 * - Progress tracking with speed/ETA
 * - Error handling with retry logic
 * - Upload cancellation
 * - Success feedback
 * - Accessibility features (ARIA labels)
 *
 * @example
 * ```tsx
 * <FileUploader
 *   config={{
 *     entityId: 'build-123',
 *     destination: 'test-reports',
 *     acceptedTypes: ['application/pdf'],
 *     maxSizeMB: 100,
 *     maxFiles: 5,
 *     onSuccess: (files) => console.log('Uploaded:', files),
 *     onError: (error) => console.error('Error:', error),
 *     onProgress: (progress) => console.log('Progress:', progress),
 *   }}
 *   label="Upload Test Report"
 *   showPreview
 * />
 * ```
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  config,
  showPreview = true,
  label = 'Upload File',
  disabled = false,
  testId = 'file-uploader',
}) => {
  const [status, setStatus] = useState<FileUploadStatus>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent>({ loaded: 0, total: 0, percentage: 0 });
  const [currentFileName, setCurrentFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const uploadStartTimeRef = useRef<number | null>(null);

  const { uploadFile, loading } = useUploadFile();
  const { isDragActive, getRootProps, getInputProps } = useDropZone({
    onDrop: handleDrop,
  });

  /**
   * Handles dropped files
   */
  async function handleDrop(files: File[]) {
    await handleFileUpload(files);
  }

  /**
   * Main file upload handler
   * Validates files, uploads them, and handles success/error states
   */
  async function handleFileUpload(files: File[]) {
    // Validate files
    const validation = validateFiles(files, config);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'File validation failed');
      setStatus('error');
      config.onError?.({
        code: validation.errorCode || 'INVALID_TYPE',
        message: validation.error || 'File validation failed',
      });
      return;
    }

    setStatus('uploading');
    setErrorMessage(null);
    uploadAbortControllerRef.current = new AbortController();
    uploadStartTimeRef.current = Date.now();

    const newUploadedFiles: UploadedFile[] = [];
    let hasError = false;

    try {
      // Upload each file
      for (const file of files) {
        setCurrentFileName(file.name);

        const formData = createFormData(file, {
          entityId: config.entityId,
          destination: config.destination,
        });

        try {
          const result = await uploadFile(
            formData,
            uploadAbortControllerRef.current,
            (prog) => {
              setProgress(prog);
              config.onProgress?.(prog);
            }
          );

          newUploadedFiles.push(result);
        } catch (uploadError) {
          const err = uploadError as Error;
          setErrorMessage(err.message);
          setStatus('error');
          config.onError?.({
            code: 'NETWORK_ERROR',
            message: err.message,
          });
          hasError = true;
          break;
        }
      }

      // Update state and call callbacks if no errors
      if (!hasError) {
        setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
        setStatus('success');
        config.onSuccess?.(newUploadedFiles);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setProgress({ loaded: 0, total: 0, percentage: 0 });
          setCurrentFileName('');
        }, 3000);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message);
      setStatus('error');
      config.onError?.({
        code: 'SERVER_ERROR',
        message: err.message,
      });
    } finally {
      uploadAbortControllerRef.current = null;
      uploadStartTimeRef.current = null;
    }
  }

  /**
   * Cancels in-progress upload
   */
  const handleCancel = useCallback(() => {
    uploadAbortControllerRef.current?.abort();
    setStatus('cancelled');
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setCurrentFileName('');
    setErrorMessage('Upload cancelled');

    // Reset to idle after 2 seconds
    setTimeout(() => {
      setStatus('idle');
      setErrorMessage(null);
    }, 2000);
  }, []);

  /**
   * Resets the component to initial state
   */
  const handleReset = useCallback(() => {
    setStatus('idle');
    setUploadedFiles([]);
    setErrorMessage(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setCurrentFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Root props for drop zone
  const rootProps = getRootProps();
  const inputProps = getInputProps();

  return (
    <div data-testid={testId} className="w-full max-w-2xl">
      {/* Upload Area */}
      <div
        {...rootProps}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-disabled={disabled || status === 'uploading'}
      >
        <input
          ref={fileInputRef}
          {...inputProps}
          disabled={disabled || status === 'uploading'}
          aria-label={label}
        />

        {/* Upload Icon */}
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-12l-3.172-3.172a4 4 0 00-5.656 0L28 12M12 32l3.172-3.172a4 4 0 015.656 0L28 32"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Upload Text */}
        <p className="mt-4 text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          Drag and drop or click to select files
        </p>
      </div>

      {/* Progress Bar */}
      {status === 'uploading' && progress.total > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Uploading: {currentFileName}</h4>
            <button
              onClick={handleCancel}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
              aria-label="Cancel upload"
            >
              Cancel
            </button>
          </div>
          <FileUploadProgress
            progress={progress}
            startTime={uploadStartTimeRef.current || undefined}
            testId={`${testId}-progress`}
          />
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <div
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
          role="alert"
        >
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Message */}
      {status === 'cancelled' && errorMessage && (
        <div
          className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Upload successful!</span>
          </div>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-sm mb-3 text-gray-900">Uploaded Files:</h4>
          <ul className="space-y-2">
            {uploadedFiles.map((f) => (
              <li
                key={f.fileId}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <svg
                    className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <a
                    href={f.fileUrl}
                    className="text-blue-600 hover:text-blue-800 underline truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {f.fileName}
                  </a>
                </div>
                <span className="text-gray-500 text-sm ml-2 flex-shrink-0">
                  ({formatFileSize(f.fileSize)})
                </span>
              </li>
            ))}
          </ul>
          {uploadedFiles.length > 0 && (
            <button
              onClick={handleReset}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Clear & Upload More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
