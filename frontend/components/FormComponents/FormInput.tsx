'use client';

import React from 'react';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  touched?: boolean;
  containerClassName?: string;
}

/**
 * Accessible form input component with built-in:
 * - Label with proper htmlFor association
 * - Error state styling (red border + error text)
 * - Error message announcement to screen readers
 * - Help text with optional tooltip
 * - Required field indicator
 * - Focus management
 */
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id,
      label,
      required = false,
      error,
      helpText,
      touched = false,
      containerClassName = '',
      className = '',
      disabled = false,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const errorId = error && touched ? `${id}-error` : undefined;
    const helpTextId = helpText ? `${id}-help` : undefined;
    const describedByIds = [errorId, helpTextId, ariaDescribedBy].filter(Boolean).join(' ');

    return (
      <div className={`flex flex-col ${containerClassName}`}>
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}
        >
          {label}
          {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
        </label>

        <input
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          aria-required={required}
          aria-invalid={touched && !!error}
          aria-describedby={describedByIds || undefined}
          className={`w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${touched && error ? 'border-2 border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'} ${className}`}
          {...props}
        />

        {helpText && !error && <p id={helpTextId} className="text-xs text-gray-600 mt-1">{helpText}</p>}

        {touched && error && (
          <div id={errorId} role="alert" className="flex items-start gap-2 mt-2">
            <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-600 font-medium">{error}</span>
          </div>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
