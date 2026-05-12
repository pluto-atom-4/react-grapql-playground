'use client';

import React from 'react';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  touched?: boolean;
  containerClassName?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
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
      showCharCount = false,
      maxLength,
      value = '',
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const errorId = error && touched ? `${id}-error` : undefined;
    const helpTextId = helpText ? `${id}-help` : undefined;
    const charCountId = showCharCount ? `${id}-count` : undefined;
    const describedByIds = [errorId, helpTextId, charCountId, ariaDescribedBy].filter(Boolean).join(' ');
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`flex flex-col ${containerClassName}`}>
        <label
          htmlFor={id}
          className={`block text-sm font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}
        >
          {label}
          {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
        </label>

        <textarea
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          aria-required={required}
          aria-invalid={touched && !!error}
          aria-describedby={describedByIds || undefined}
          maxLength={maxLength}
          value={value}
          className={`w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed resize-vertical ${touched && error ? 'border-2 border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'} ${className}`}
          {...props}
        />

        <div className="flex justify-between items-start mt-1 text-xs">
          <div>
            {helpText && !error && <p id={helpTextId} className="text-gray-600">{helpText}</p>}
          </div>
          {showCharCount && maxLength && <p id={charCountId} className={`text-gray-500 ${charCount > maxLength * 0.9 ? 'text-yellow-600' : ''}`}>{charCount}/{maxLength}</p>}
        </div>

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

FormTextarea.displayName = 'FormTextarea';
