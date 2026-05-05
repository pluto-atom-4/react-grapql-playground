/**
 * FileUploader Component Exports
 * Main entry point for the FileUploader component and related utilities.
 */

export { FileUploader, default } from './FileUploader';
export { FileUploadProgress } from './FileUploadProgress';
export { useUploadFile } from './useUploadFile';
export { useDropZone } from './useDropZone';

// Types
export type {
  FileUploadConfig,
  FileUploaderProps,
  FileUploadStatus,
  UploadedFile,
  UploadError,
  ProgressEvent,
  ErrorCode,
  ValidationResult,
  DropZoneReturn,
} from './types';

// Utilities
export { validateFiles, formatFileSize, generateFileId, getErrorMessage } from './utils';

// Constants
export { FILE_CONFIG, ERROR_MESSAGES, getUploadEndpoint } from './constants';
