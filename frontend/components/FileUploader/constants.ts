/**
 * FileUploader Constants
 * Centralized configuration for file upload limits, MIME types, and error messages.
 */

import type { ErrorCode } from './types';

/**
 * Default file upload configuration
 */
export const FILE_CONFIG = {
  MAX_SIZE_MB: 50,
  MAX_FILES: 5,
  ACCEPTED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/csv'],
  UPLOAD_TIMEOUT_MS: 300000, // 5 minutes
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
} as const;

/**
 * Error code to user-friendly message mapping
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_TYPE: 'File type not allowed. Please upload a valid file.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 50MB per file.',
  TOO_MANY_FILES: 'Too many files selected. Maximum is 5 files at a time.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  SERVER_ERROR: 'Server error during upload. Please try again later.',
  CANCELLED: 'Upload was cancelled.',
} as const;

/**
 * MIME type friendly names
 */
export const MIME_TYPE_NAMES: Record<string, string> = {
  'application/pdf': 'PDF Document',
  'image/jpeg': 'JPEG Image',
  'image/png': 'PNG Image',
  'image/gif': 'GIF Image',
  'text/csv': 'CSV File',
} as const;

/**
 * Upload endpoint URLs
 */
export const UPLOAD_ENDPOINTS = {
  DEVELOPMENT: 'http://localhost:5000/upload',
  PRODUCTION: '/api/upload',
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

/**
 * Get upload endpoint URL
 */
export function getUploadEndpoint(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_EXPRESS_URL) {
    return `${process.env.NEXT_PUBLIC_EXPRESS_URL}/upload`;
  }
  return UPLOAD_ENDPOINTS.PRODUCTION;
}
