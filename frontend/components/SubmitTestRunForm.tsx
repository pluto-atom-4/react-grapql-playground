'use client';

import React, { useState, useCallback, SubmitEvent } from 'react';
import { FileUploader } from './FileUploader';
import { useSubmitTestRun, TestStatus } from '@/lib/apollo-hooks';
import { useToast } from '@/lib/error-notifier';
import type { UploadedFile, UploadError } from './FileUploader/types';

export interface SubmitTestRunFormProps {
  buildId: string;
  onSuccess?: (testRun: { id: string; buildId: string; status: TestStatus }) => void;
  onCancel?: () => void;
}

interface FormState {
  fileUrl: string | null;
  fileName: string | null;
  status: TestStatus | null;
  result: string;
  error: string | null;
  isSubmitting: boolean;
}

/**
 * SubmitTestRunForm Component
 *
 * A form component for submitting test runs with:
 * - File upload via FileUploader (required)
 * - Test status dropdown (required)
 * - Test result textarea (optional, max 500 chars)
 * - Form validation
 * - GraphQL mutation integration
 * - Error handling
 * - Loading state
 *
 * @example
 * ```tsx
 * <SubmitTestRunForm
 *   buildId="build-123"
 *   onSuccess={(testRun) => console.log('Test run submitted:', testRun)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export const SubmitTestRunForm: React.FC<SubmitTestRunFormProps> = ({
  buildId,
  onSuccess,
  onCancel,
}) => {
  const toast = useToast();
  const { submitTestRun, loading, error: mutationError } = useSubmitTestRun();

  const [formState, setFormState] = useState<FormState>({
    fileUrl: null,
    fileName: null,
    status: null,
    result: '',
    error: null,
    isSubmitting: false,
  });

  /**
   * Handle successful file upload
   */
  const handleUploadSuccess = useCallback((files: UploadedFile[]): void => {
    if (files.length > 0) {
      const file = files[0];
      setFormState((prev) => ({
        ...prev,
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        error: null,
      }));
    }
  }, []);

  /**
   * Handle file upload error
   */
  const handleUploadError = useCallback((error: UploadError): void => {
    setFormState((prev) => ({
      ...prev,
      error: `File upload error: ${error.message}`,
    }));
  }, []);

  /**
   * Handle status dropdown change
   */
  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value as TestStatus | '';
    setFormState((prev) => ({
      ...prev,
      status: (value as TestStatus) || null,
      error: null,
    }));
  }, []);

  /**
   * Handle result textarea change
   */
  const handleResultChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    // Enforce 500 character limit
    const limitedValue = value.slice(0, 500);
    setFormState((prev) => ({
      ...prev,
      result: limitedValue,
    }));
  }, []);

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    if (!formState.status) {
      setFormState((prev) => ({
        ...prev,
        error: 'Please select a test status',
      }));
      return false;
    }

    if (!formState.fileUrl) {
      setFormState((prev) => ({
        ...prev,
        error: 'Please upload a test evidence file',
      }));
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      error: null,
    }));

    // Submit asynchronously without waiting
    void submitTestRun(
      buildId,
      formState.status!,
      formState.result.trim() || undefined,
      formState.fileUrl || undefined
    )
      .then((response) => {
        if (response) {
          toast.success('Test run submitted successfully!');
          onSuccess?.(response);
        }
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : 'Submission failed';
        setFormState((prev) => ({
          ...prev,
          error: errorMsg,
          isSubmitting: false,
        }));
        toast.error(errorMsg);
      });
  };

  const isDisabled = formState.isSubmitting || loading;
  const displayError = formState.error || mutationError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Submit Test Run</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close form"
            disabled={isDisabled}
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              ❌ Error: {typeof displayError === 'string' ? displayError : 'An error occurred'}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FileUploader Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Test Evidence File <span className="text-red-600">*</span>
            </label>
            <FileUploader
              config={{
                entityId: buildId,
                destination: 'test-reports',
                acceptedTypes: ['application/pdf', 'text/csv', 'application/json'],
                maxSizeMB: 50,
                maxFiles: 1,
                onSuccess: handleUploadSuccess,
                onError: handleUploadError,
              }}
              label="Upload test evidence (PDF, CSV, or JSON)"
              disabled={isDisabled}
              showPreview={false}
              testId="submit-test-run-file-uploader"
            />
            {formState.fileName && (
              <p className="text-sm text-green-600 mt-3 flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span>File selected: {formState.fileName}</span>
              </p>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <label htmlFor="test-status" className="block text-sm font-semibold text-gray-900 mb-3">
              Test Status <span className="text-red-600">*</span>
            </label>
            <select
              id="test-status"
              value={formState.status || ''}
              onChange={handleStatusChange}
              disabled={isDisabled}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              aria-label="Test result status"
              aria-required="true"
            >
              <option value="">-- Select Test Status --</option>
              <option value={TestStatus.Passed}>✓ Passed</option>
              <option value={TestStatus.Failed}>✗ Failed</option>
              <option value={TestStatus.Pending}>⏳ Pending</option>
              <option value={TestStatus.Running}>🔄 Running</option>
            </select>
          </div>

          {/* Result Textarea */}
          <div>
            <label htmlFor="test-result" className="block text-sm font-semibold text-gray-900 mb-3">
              Test Result Summary
            </label>
            <textarea
              id="test-result"
              value={formState.result}
              onChange={handleResultChange}
              disabled={isDisabled}
              placeholder="Optional: Describe test results, observations, or findings..."
              maxLength={500}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              aria-label="Test result summary"
            />
            <p className="text-xs text-gray-500 mt-2">
              {formState.result.length} / 500 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDisabled}
              className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formState.status || !formState.fileUrl || isDisabled}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              aria-busy={isDisabled}
            >
              {formState.isSubmitting || loading ? (
                <>
                  <span className="inline-block animate-spin">⚙</span>
                  Submitting...
                </>
              ) : (
                'Submit Test Run'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
