/**
 * FileUploader Utilities
 * Provides validation and formatting functions for file upload.
 */

import type { FileUploadConfig, ValidationResult, ErrorCode } from './types';
import { FILE_CONFIG, ERROR_MESSAGES } from './constants';

/**
 * Validates a list of files against the upload configuration.
 * Checks file count, size, and MIME type.
 *
 * @param files - Array of files to validate
 * @param config - Upload configuration with size and type limits
 * @returns ValidationResult with validity status and error details
 */
export function validateFiles(files: File[], config: FileUploadConfig): ValidationResult {
  if (files.length === 0) {
    return {
      valid: false,
      error: 'No files selected',
      errorCode: 'INVALID_TYPE',
    };
  }

  const maxSize = (config.maxSizeMB || FILE_CONFIG.MAX_SIZE_MB) * 1024 * 1024;
  const maxFiles = config.maxFiles || FILE_CONFIG.MAX_FILES;
  const acceptedTypes = config.acceptedTypes || [...FILE_CONFIG.ACCEPTED_TYPES];

  // Check file count
  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Maximum ${maxFiles} files allowed`,
      errorCode: 'TOO_MANY_FILES',
    };
  }

  // Validate each file
  for (const file of files) {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File "${file.name}" exceeds ${config.maxSizeMB}MB limit`,
        errorCode: 'FILE_TOO_LARGE',
      };
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" not allowed for "${file.name}"`,
        errorCode: 'INVALID_TYPE',
      };
    }
  }

  return { valid: true };
}

/**
 * Formats file size from bytes to human-readable format.
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generates a unique file ID
 *
 * @returns UUID v4 string
 */
export function generateFileId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets user-friendly error message for an error code
 *
 * @param errorCode - Error code
 * @returns User-friendly error message
 */
export function getErrorMessage(errorCode: ErrorCode): string {
  return ERROR_MESSAGES[errorCode] || 'An unexpected error occurred';
}

/**
 * Determines if a file type is an image
 *
 * @param mimeType - MIME type of the file
 * @returns true if the file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Determines if a file type is a PDF
 *
 * @param mimeType - MIME type of the file
 * @returns true if the file is a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Creates a FormData object from file and metadata
 *
 * @param file - File to upload
 * @param metadata - Additional metadata to include
 * @returns FormData object ready for upload
 */
export function createFormData(
  file: File,
  metadata?: Record<string, string | undefined>
): FormData {
  const formData = new FormData();
  formData.append('file', file);

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });
  }

  return formData;
}

/**
 * Calculates upload speed in Mbps
 *
 * @param bytes - Bytes uploaded
 * @param milliseconds - Time elapsed in milliseconds
 * @returns Upload speed in Mbps
 */
export function calculateUploadSpeed(bytes: number, milliseconds: number): number {
  if (milliseconds === 0) return 0;
  const seconds = milliseconds / 1000;
  const megabits = (bytes * 8) / (1024 * 1024);
  return megabits / seconds;
}

/**
 * Estimates remaining upload time
 *
 * @param totalBytes - Total bytes to upload
 * @param uploadedBytes - Bytes already uploaded
 * @param uploadSpeedMbps - Upload speed in Mbps
 * @returns Estimated time remaining in seconds
 */
export function estimateRemainingTime(
  totalBytes: number,
  uploadedBytes: number,
  uploadSpeedMbps: number
): number {
  if (uploadSpeedMbps === 0) return 0;
  const remainingBytes = totalBytes - uploadedBytes;
  const megabits = (remainingBytes * 8) / (1024 * 1024);
  return megabits / uploadSpeedMbps;
}

/**
 * Formats time in seconds to human-readable format
 *
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "2m 30s")
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}
