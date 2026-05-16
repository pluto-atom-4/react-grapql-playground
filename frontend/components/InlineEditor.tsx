'use client';

import { useState, type ReactElement } from 'react';

/**
 * Field configuration for InlineEditor
 */
export interface EditableField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'number';
  value: string | number;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  disabled?: boolean;
  rows?: number; // For textarea
}

/**
 * Props for InlineEditor component
 */
export interface InlineEditorProps {
  fields: EditableField[];
  onSave: (data: Record<string, string | number>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  className?: string;
}

/**
 * InlineEditor Component
 *
 * Provides inline editing capability for various field types
 * - Text input
 * - Textarea
 * - Select dropdown
 * - Email input
 * - Number input
 *
 * Features:
 * - Multiple fields with validation
 * - Save/Cancel buttons
 * - Loading state during save
 * - Keyboard shortcuts (Enter to save, Escape to cancel)
 * - Error handling and display
 * - Accessibility (proper labels, ARIA attributes)
 *
 * @example
 * <InlineEditor
 *   fields={[
 *     { name: 'name', label: 'Build Name', type: 'text', value: 'Build 1' },
 *     { name: 'status', label: 'Status', type: 'select', value: 'RUNNING',
 *       options: [
 *         { value: 'PENDING', label: 'Pending' },
 *         { value: 'RUNNING', label: 'Running' },
 *       ]
 *     },
 *   ]}
 *   onSave={async (data) => { await updateBuild(data); }}
 *   onCancel={() => setEditMode(false)}
 * />
 */
export function InlineEditor({
  fields,
  onSave,
  onCancel,
  isLoading = false,
  title = 'Edit',
  className = '',
}: InlineEditorProps): ReactElement {
  const [formData, setFormData] = useState<Record<string, string | number>>(
    Object.fromEntries(fields.map(f => [f.name, f.value])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (fieldName: string, value: string | number): void => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(formData[field.name]))) {
          newErrors[field.name] = 'Invalid email format';
        }
      }

      if (field.type === 'number' && formData[field.name]) {
        if (isNaN(Number(formData[field.name]))) {
          newErrors[field.name] = 'Must be a number';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      void handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}

      <form
        onKeyDown={handleKeyDown}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="space-y-4"
      >
        {fields.map(field => (
          <div key={field.name} className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows || 3}
                disabled={field.disabled || isLoading || isSaving}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                aria-invalid={!!errors[field.name]}
              />
            ) : field.type === 'select' && field.options ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                disabled={field.disabled || isLoading || isSaving}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                aria-invalid={!!errors[field.name]}
              >
                <option value="">Select an option</option>
                {field.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                disabled={field.disabled || isLoading || isSaving}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                aria-invalid={!!errors[field.name]}
              />
            )}

            {errors[field.name] && (
              <p id={`${field.name}-error`} className="text-sm text-red-600">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}

        {errors.submit && (
          <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving || isLoading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      <div className="text-xs text-gray-500 mt-4">
        <p>💡 Tip: Press Ctrl+Enter to save or Escape to cancel</p>
      </div>
    </div>
  );
}
