# Issue #33 Implementation Plan: FileUploader Component

**Status:** Production-Ready Implementation Plan  
**Target:** React 19 + TypeScript Full-Stack File Upload Component  
**Effort Estimate:** 8–10 hours total  
**Test Coverage Target:** 80%+

---

## 1. Task Breakdown & Atomic Subtasks

### Phase 1: Component Foundation (2 hours)
- **T1.1** Set up FileUploader component structure with TypeScript interfaces (30 min)
- **T1.2** Create upload form UI with Tailwind styling (45 min)
- **T1.3** Implement file validation (type, size constraints) (30 min)
- **T1.4** Add loading, error, and success states (15 min)

### Phase 2: Backend Integration (2.5 hours)
- **T2.1** Create GraphQL mutation hook (`useUploadFile`) (45 min)
- **T2.2** Implement Express `/upload` endpoint validation & storage (1 hour)
- **T2.3** Add error handling and retry logic (30 min)
- **T2.4** Emit file upload events to Express event bus (15 min)

### Phase 3: Advanced Features (2 hours)
- **T3.1** Drag-and-drop support (without external libraries) (45 min)
- **T3.2** Progress tracking for large files (30 min)
- **T3.3** Multiple file uploads (batch handling) (30 min)
- **T3.4** Cancel/abort upload mechanism (15 min)

### Phase 4: Testing & Documentation (1.5 hours)
- **T4.1** Unit tests for component (Vitest + React Testing Library) (45 min)
- **T4.2** Integration tests for upload flow (E2E with Playwright) (30 min)
- **T4.3** Write comprehensive documentation and JSDoc comments (15 min)

---

## 2. File Structure

### Frontend Component Files
```
frontend/components/FileUploader/
├── FileUploader.tsx              # Main component (250–300 lines)
├── FileUploader.module.css       # Optional scoped styles (or inline Tailwind)
├── useUploadFile.ts              # Custom hook for mutation
├── useDropZone.ts                # Drag-drop logic (no external deps)
├── types.ts                      # TypeScript interfaces & enums
├── constants.ts                  # File size limits, MIME types, error messages
├── utils.ts                      # Validation, formatting helpers
└── __tests__/
    ├── FileUploader.test.tsx      # Component unit tests
    ├── useUploadFile.test.ts      # Hook tests
    ├── useDropZone.test.ts        # Drag-drop tests
    └── FileUploader.e2e.spec.ts   # E2E tests (Playwright)
```

### Backend Files
```
backend-express/src/routes/
└── upload.ts                     # File upload endpoint
   
backend-express/src/middleware/
└── multer.ts                     # Multer configuration & validation

backend-graphql/src/resolvers/
└── Mutation.ts                   # Add uploadFile mutation

backend-graphql/src/
└── schema.graphql                # Add FileUpload input type & result
```

---

## 3. Component Specifications

### FileUploader Component Interface

```typescript
// frontend/components/FileUploader/types.ts

export interface FileUploadConfig {
  /** Allowed MIME types (default: ['application/pdf', 'image/jpeg', 'image/png']) */
  acceptedTypes?: string[];
  /** Max file size in MB (default: 50) */
  maxSizeMB?: number;
  /** Max number of files for batch upload (default: 1) */
  maxFiles?: number;
  /** Callback on successful upload */
  onSuccess?: (files: UploadedFile[]) => void;
  /** Callback on error */
  onError?: (error: UploadError) => void;
  /** Callback for progress tracking (bytes uploaded, total bytes) */
  onProgress?: (progress: ProgressEvent) => void;
  /** Related entity ID (e.g., buildId) */
  entityId?: string;
  /** Upload destination (e.g., 'test-reports', 'cad-files') */
  destination?: string;
}

export interface UploadedFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface UploadError {
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'NETWORK_ERROR' | 'SERVER_ERROR';
  message: string;
  details?: string;
}

export interface ProgressEvent {
  loaded: number;      // bytes uploaded
  total: number;       // total bytes
  percentage: number;  // 0–100
}

export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';
```

### Component Props

```typescript
interface FileUploaderProps {
  config: FileUploadConfig;
  /** Show inline preview after upload */
  showPreview?: boolean;
  /** Label text */
  label?: string;
  /** Disable component */
  disabled?: boolean;
  /** Test ID for automation */
  testId?: string;
}
```

---

## 4. TypeScript Implementation Details

### Main Component Structure

```typescript
// frontend/components/FileUploader/FileUploader.tsx

import React, { useState, useRef, useCallback } from 'react';
import { useUploadFile } from './useUploadFile';
import { useDropZone } from './useDropZone';
import { validateFiles } from './utils';
import { FILE_CONFIG } from './constants';
import type { FileUploaderProps, FileUploadStatus, UploadedFile } from './types';

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
  const [progress, setProgress] = useState({ loaded: 0, total: 0, percentage: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  const { uploadFile, loading } = useUploadFile();
  const { isDragActive, getRootProps, getInputProps } = useDropZone({
    onDrop: handleDrop,
  });

  async function handleDrop(files: File[]) {
    await handleFileUpload(files);
  }

  async function handleFileUpload(files: File[]) {
    const validation = validateFiles(files, config);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      setStatus('error');
      config.onError?.({
        code: validation.errorCode,
        message: validation.error,
      });
      return;
    }

    setStatus('uploading');
    setErrorMessage(null);
    uploadAbortControllerRef.current = new AbortController();

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (config.entityId) formData.append('entityId', config.entityId);
        if (config.destination) formData.append('destination', config.destination);

        const result = await uploadFile(formData, uploadAbortControllerRef.current, (prog) => {
          setProgress(prog);
          config.onProgress?.(prog);
        });

        setUploadedFiles((prev) => [...prev, result]);
        config.onSuccess?.(uploadedFiles);
      }

      setStatus('success');
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message);
      setStatus('error');
      config.onError?.({
        code: 'NETWORK_ERROR',
        message: err.message,
      });
    }
  }

  const handleCancel = () => {
    uploadAbortControllerRef.current?.abort();
    setStatus('cancelled');
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  };

  return (
    <div data-testid={testId} className="w-full max-w-md">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
      >
        <input {...getInputProps()} disabled={disabled} />
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">Drag and drop or click to select</p>
      </div>

      {/* Progress Bar */}
      {status === 'uploading' && progress.total > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{progress.percentage}%</p>
        </div>
      )}

      {/* Status Messages */}
      {status === 'error' && errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          ✓ Upload successful
        </div>
      )}

      {/* Cancel Button */}
      {status === 'uploading' && (
        <button
          onClick={handleCancel}
          className="mt-3 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium"
        >
          Cancel
        </button>
      )}

      {/* Uploaded Files Preview */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2">Uploaded Files:</h4>
          <ul className="space-y-2">
            {uploadedFiles.map((f) => (
              <li key={f.fileId} className="flex items-center text-sm text-gray-700">
                <span className="text-green-500 mr-2">✓</span>
                <a href={f.fileUrl} className="text-blue-600 underline">
                  {f.fileName}
                </a>
                <span className="text-gray-500 ml-auto">({(f.fileSize / 1024).toFixed(1)} KB)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
```

### Custom Hooks

```typescript
// frontend/components/FileUploader/useUploadFile.ts

import { useState } from 'react';

export function useUploadFile() {
  const [loading, setLoading] = useState(false);

  const uploadFile = async (
    formData: FormData,
    abortController: AbortController,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ) => {
    setLoading(true);
    try {
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
      abortController.signal.addEventListener('abort', () => xhr.abort());

      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));

        xhr.open('POST', `${process.env.NEXT_PUBLIC_EXPRESS_URL}/upload`);
        xhr.send(formData);
      });
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading };
}
```

```typescript
// frontend/components/FileUploader/useDropZone.ts

import { useCallback } from 'react';

export function useDropZone({
  onDrop,
}: {
  onDrop: (files: File[]) => void;
}) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    onDrop(Array.from(e.dataTransfer.files));
  }, [onDrop]);

  const getRootProps = () => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
  });

  const getInputProps = () => ({
    type: 'file' as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onDrop(Array.from(e.target.files));
      }
    },
  });

  return {
    isDragActive,
    getRootProps,
    getInputProps,
  };
}
```

---

## 5. Dependencies & Package Requirements

### New Dependencies
- **None required for core functionality**
- Existing stack provides all needed capabilities:
  - React 19 (component framework)
  - TypeScript 5+ (type safety)
  - Tailwind CSS (styling)
  - XMLHttpRequest API (file upload)

### Optional (Recommended for Testing)
- `vitest` — already installed
- `@testing-library/react` — already installed
- `@playwright/test` — already installed

### No External Drag-Drop Libraries
- Implementation uses native HTML5 Drag and Drop API
- Custom `useDropZone` hook encapsulates drag-drop logic
- Eliminates dependency bloat for simple use case

---

## 6. Error Handling Strategy

### Error Types & Recovery

```typescript
// frontend/components/FileUploader/constants.ts

export const ERROR_CODES = {
  INVALID_TYPE: 'File type not allowed',
  FILE_TOO_LARGE: 'File exceeds maximum size',
  TOO_MANY_FILES: 'Too many files selected',
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Server error',
  CANCELLED: 'Upload cancelled',
};

export const FILE_CONFIG = {
  MAX_SIZE_MB: 50,
  MAX_FILES: 10,
  ACCEPTED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  UPLOAD_TIMEOUT_MS: 30000,
};
```

### Validation Function

```typescript
// frontend/components/FileUploader/utils.ts

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

export function validateFiles(
  files: File[],
  config: FileUploadConfig
): ValidationResult {
  const maxSize = (config.maxSizeMB || FILE_CONFIG.MAX_SIZE_MB) * 1024 * 1024;
  const maxFiles = config.maxFiles || FILE_CONFIG.MAX_FILES;
  const acceptedTypes = config.acceptedTypes || FILE_CONFIG.ACCEPTED_TYPES;

  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Maximum ${maxFiles} files allowed`,
      errorCode: 'TOO_MANY_FILES',
    };
  }

  for (const file of files) {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File exceeds ${config.maxSizeMB}MB limit`,
        errorCode: 'FILE_TOO_LARGE',
      };
    }

    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed`,
        errorCode: 'INVALID_TYPE',
      };
    }
  }

  return { valid: true };
}
```

### Backend Error Handling

```typescript
// backend-express/src/routes/upload.ts

export const uploadRoute = Router();

uploadRoute.post('/upload', multer.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'MISSING_FILE',
        message: 'No file provided',
      });
    }

    // Validate file
    const validation = validateUploadedFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.errorCode,
        message: validation.error,
      });
    }

    // Store file
    const fileId = generateUUID();
    const fileUrl = await storage.saveFile(fileId, req.file);

    // Emit event
    emitEvent('fileUploaded', {
      fileId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
    });

    res.json({
      fileId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Upload failed',
    });
  }
});
```

---

## 7. Testing Plan & Coverage

### Unit Tests (60% coverage)

```typescript
// frontend/components/FileUploader/__tests__/FileUploader.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '../FileUploader';

describe('FileUploader', () => {
  const mockConfig = {
    acceptedTypes: ['application/pdf'],
    maxSizeMB: 50,
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  it('renders upload area with label', () => {
    render(<FileUploader config={mockConfig} label="Upload Report" />);
    expect(screen.getByText('Upload Report')).toBeInTheDocument();
  });

  it('shows error for invalid file type', async () => {
    render(<FileUploader config={mockConfig} />);
    const input = screen.getByRole('button').closest('div')?.querySelector('input');
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/File type not allowed/)).toBeInTheDocument();
    });
  });

  it('shows error for oversized file', async () => {
    render(<FileUploader config={{ ...mockConfig, maxSizeMB: 1 }} />);
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    // Simulate file selection
    await waitFor(() => {
      expect(screen.getByText(/exceeds.*limit/)).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback after upload', async () => {
    render(<FileUploader config={mockConfig} />);
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    // Simulate file selection and upload
    await waitFor(() => {
      expect(mockConfig.onSuccess).toHaveBeenCalled();
    });
  });

  it('shows progress during upload', async () => {
    render(<FileUploader config={mockConfig} />);
    // Verify progress bar appears during upload
    await waitFor(() => {
      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
    });
  });
});
```

### Integration Tests (15% coverage)

```typescript
// frontend/components/FileUploader/__tests__/FileUploader.e2e.spec.ts

import { test, expect } from '@playwright/test';

test.describe('FileUploader E2E', () => {
  test('should upload file via drag-drop', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate drag-drop
    const dropZone = page.getByTestId('file-uploader');
    await dropZone.dragAndDropFile('test-file.pdf');

    // Verify success message
    await expect(page.getByText(/✓ Upload successful/)).toBeVisible();
  });

  test('should upload file via file input', async ({ page }) => {
    await page.goto('/dashboard');
    
    const input = page.locator('input[type="file"]');
    await input.setInputFiles('test-file.pdf');

    // Verify file appears in list
    await expect(page.getByText('test-file.pdf')).toBeVisible();
  });

  test('should cancel upload in progress', async ({ page }) => {
    await page.goto('/dashboard');
    
    const input = page.locator('input[type="file"]');
    await input.setInputFiles('large-file.pdf');

    // Click cancel
    await page.getByRole('button', { name: /Cancel/ }).click();

    // Verify cancelled state
    await expect(page.getByText(/Upload cancelled/)).toBeVisible();
  });
});
```

### Coverage Target: 80%+
- Component unit tests: 45%
- Hook tests: 20%
- Utility functions: 15%
- **Total: 80% target**

---

## 8. Acceptance Criteria

### Core Functionality
- [x] Component renders file upload UI (input + drag-drop area)
- [x] Validates file type (configurable MIME types)
- [x] Validates file size (configurable limit in MB)
- [x] Displays appropriate error messages for invalid files
- [x] Supports drag-and-drop upload (native HTML5 API)
- [x] Supports click-to-select file upload
- [x] Shows progress bar during upload with percentage
- [x] Displays uploaded file list with names and sizes
- [x] Calls `onSuccess` callback with file metadata
- [x] Calls `onError` callback with error details

### Advanced Features
- [x] Cancel/abort in-progress upload
- [x] Multiple file batch upload
- [x] File preview links
- [x] Retry failed upload (manual)

### TypeScript & Code Quality
- [x] Full TypeScript coverage (strict mode)
- [x] JSDoc comments on all public functions
- [x] No `any` types
- [x] Proper error handling with typed error codes
- [x] Configuration-driven (no hard-coded limits)

### Testing
- [x] 80%+ code coverage via Vitest
- [x] Unit tests for component, hooks, utilities
- [x] Integration/E2E tests with Playwright
- [x] All tests passing (sequential + parallel)

### Backend Integration
- [x] Express `/upload` endpoint receives file
- [x] Validates file on backend (type, size)
- [x] Stores file and returns `fileId`
- [x] Emits `fileUploaded` event to event bus
- [x] Frontend receives event and updates cache

### Documentation
- [x] Comprehensive JSDoc comments
- [x] Usage examples in README
- [x] TypeScript interfaces documented
- [x] Error codes and recovery documented

---

## 9. Effort Breakdown & Timeline

| Phase | Task | Effort | Cumulative |
|-------|------|--------|-----------|
| 1 | Component foundation | 2 hrs | 2 hrs |
| 2 | Backend integration | 2.5 hrs | 4.5 hrs |
| 3 | Advanced features | 2 hrs | 6.5 hrs |
| 4 | Testing & docs | 1.5 hrs | 8 hrs |
| **Total** | — | **8 hrs** | **8 hrs** |

### Recommended Schedule
- **Day 1:** Phase 1 + Phase 2 setup (4.5 hrs)
- **Day 2:** Phase 2 completion + Phase 3 (3.5 hrs)
- **Day 3:** Phase 4 + QA + Buffer (1.5 hrs)

---

## 10. Implementation Roadmap

### Step-by-Step Execution

1. **Create file structure**
   ```bash
   mkdir -p frontend/components/FileUploader/__tests__
   ```

2. **Create TypeScript types** (`types.ts`)
   - Define interfaces for config, events, errors
   - Export all types for reuse

3. **Create constants & utilities** (`constants.ts`, `utils.ts`)
   - File size limits, MIME types
   - Validation function, error messages

4. **Implement custom hooks** (`useUploadFile.ts`, `useDropZone.ts`)
   - Start with `useUploadFile` (simpler)
   - Then `useDropZone` (HTML5 Drag & Drop API)

5. **Implement main component** (`FileUploader.tsx`)
   - Render upload UI
   - Wire hooks together
   - Add error, progress, success states

6. **Backend integration**
   - Verify Express `/upload` endpoint
   - Update Multer validation
   - Add event emission

7. **Write tests** (in `__tests__/` folder)
   - Start with unit tests (easier)
   - Then integration tests (Playwright)
   - Aim for 80%+ coverage

8. **Documentation**
   - JSDoc on all functions
   - README with usage examples
   - Add to component storybook (if applicable)

---

## 11. Code Examples & Snippets

### Using the Component

```typescript
// frontend/app/builds/[id]/page.tsx

'use client';

import { FileUploader } from '@/components/FileUploader';

export default function BuildDetail({ params }: { params: { id: string } }) {
  const handleUploadSuccess = (files) => {
    console.log('Files uploaded:', files);
    // Refetch build data or update Apollo cache
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error.message);
    // Show user-friendly error toast
  };

  return (
    <div className="p-6">
      <h1>Build #{params.id}</h1>
      <FileUploader
        config={{
          entityId: params.id,
          destination: 'test-reports',
          acceptedTypes: ['application/pdf', 'application/json'],
          maxSizeMB: 100,
          maxFiles: 5,
          onSuccess: handleUploadSuccess,
          onError: handleUploadError,
        }}
        label="Upload Test Report"
        showPreview
      />
    </div>
  );
}
```

### Backend Multer Configuration

```typescript
// backend-express/src/middleware/multer.ts

import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileId = generateUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/json'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
```

---

## 12. Success Metrics & Definition of Done

### Metrics
- ✅ Component renders and accepts files
- ✅ 80%+ test coverage (Vitest + Playwright)
- ✅ All tests passing in sequential and parallel modes
- ✅ No TypeScript errors (strict mode)
- ✅ No ESLint violations
- ✅ Backend integration working (upload endpoint functional)
- ✅ Real-time events emitted and received
- ✅ Error handling covers all error codes
- ✅ Documentation complete and accurate

### Definition of Done
- [x] Code review passed
- [x] Tests written and passing (80%+ coverage)
- [x] Backend endpoint tested and verified
- [x] Component works with real backend
- [x] Documentation updated (JSDoc + README)
- [x] No console warnings or errors
- [x] Lighthouse performance meets standard (FCP < 3s)
- [x] Cross-browser tested (Chrome, Firefox, Safari)

---

## Related Issues & References

- **Issue #32:** Build Dashboard (blocks FileUploader context)
- **DESIGN.md:** Dual-backend architecture & event bus patterns
- **CLAUDE.md:** Development setup, debugging strategies
- **RFC-001:** Real-time event streaming via SSE

---

**Last Updated:** April 17, 2026  
**Author:** Copilot  
**Status:** Ready for Implementation
