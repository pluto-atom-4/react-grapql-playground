/**
 * File upload utilities tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateFiles,
  formatFileSize,
  generateFileId,
  getErrorMessage,
  isImageFile,
  isPdfFile,
  createFormData,
  calculateUploadSpeed,
  estimateRemainingTime,
  formatTime,
} from '../utils';
import { FILE_CONFIG } from '../constants';

describe('FileUploader Utilities', () => {
  describe('validateFiles', () => {
    it('should accept valid files', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFiles([file], { acceptedTypes: ['application/pdf'] });
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const largeContent = new ArrayBuffer(60 * 1024 * 1024); // 60MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = validateFiles([file], { maxSizeMB: 50, acceptedTypes: ['application/pdf'] });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should reject files with invalid type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateFiles([file], { acceptedTypes: ['application/pdf'] });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_TYPE');
    });

    it('should reject when too many files', () => {
      const files = Array(10)
        .fill(null)
        .map((_, i) =>
          new File(['content'], `test${i}.pdf`, { type: 'application/pdf' })
        );
      const result = validateFiles(files, { maxFiles: 5, acceptedTypes: ['application/pdf'] });
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('TOO_MANY_FILES');
    });

    it('should reject empty file array', () => {
      const result = validateFiles([], {});
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_TYPE');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536, 2)).toBe('1.5 KB');
      expect(formatFileSize(1536, 0)).toBe('2 KB');
    });
  });

  describe('generateFileId', () => {
    it('should generate valid UUID v4', () => {
      const id = generateFileId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = generateFileId();
      const id2 = generateFileId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message for valid code', () => {
      expect(getErrorMessage('INVALID_TYPE')).toContain('File type not allowed');
      expect(getErrorMessage('FILE_TOO_LARGE')).toContain('too large');
      expect(getErrorMessage('NETWORK_ERROR')).toContain('Network error');
    });

    it('should return default message for unknown code', () => {
      expect(getErrorMessage('CANCELLED')).toBeDefined();
    });
  });

  describe('isImageFile', () => {
    it('should identify image files', () => {
      expect(isImageFile('image/jpeg')).toBe(true);
      expect(isImageFile('image/png')).toBe(true);
      expect(isImageFile('image/gif')).toBe(true);
    });

    it('should reject non-image files', () => {
      expect(isImageFile('application/pdf')).toBe(false);
      expect(isImageFile('text/csv')).toBe(false);
    });
  });

  describe('isPdfFile', () => {
    it('should identify PDF files', () => {
      expect(isPdfFile('application/pdf')).toBe(true);
    });

    it('should reject non-PDF files', () => {
      expect(isPdfFile('image/jpeg')).toBe(false);
      expect(isPdfFile('text/csv')).toBe(false);
    });
  });

  describe('createFormData', () => {
    it('should create FormData with file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const formData = createFormData(file);
      expect(formData.get('file')).toBe(file);
    });

    it('should include metadata in FormData', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const formData = createFormData(file, { entityId: '123', destination: 'test-reports' });
      expect(formData.get('entityId')).toBe('123');
      expect(formData.get('destination')).toBe('test-reports');
    });

    it('should skip undefined metadata', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const formData = createFormData(file, { entityId: '123', destination: undefined });
      expect(formData.get('entityId')).toBe('123');
      expect(formData.has('destination')).toBe(false);
    });
  });

  describe('calculateUploadSpeed', () => {
    it('should calculate upload speed correctly', () => {
      // 1 MB in 1 second = 8 Mbps
      const speed = calculateUploadSpeed(1024 * 1024, 1000);
      expect(speed).toBeCloseTo(8, 0);
    });

    it('should handle zero time', () => {
      const speed = calculateUploadSpeed(1024 * 1024, 0);
      expect(speed).toBe(0);
    });
  });

  describe('estimateRemainingTime', () => {
    it('should estimate remaining time correctly', () => {
      // 2 MB total, 1 MB uploaded, 8 Mbps speed = 1 second
      const time = estimateRemainingTime(2 * 1024 * 1024, 1024 * 1024, 8);
      expect(time).toBeCloseTo(1, 0);
    });

    it('should handle zero speed', () => {
      const time = estimateRemainingTime(2 * 1024 * 1024, 0, 0);
      expect(time).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(30)).toBe('30s');
      expect(formatTime(90)).toMatch(/1m \d+s/);
      expect(formatTime(3661)).toMatch(/1h \d+m/);
    });
  });
});
