'use client';

import type { ReactNode, ReactElement } from 'react';
import React from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches errors in child components and displays fallback UI
 * Prevents entire modal from crashing if one tab fails
 *
 * Features:
 * - Error catching and logging
 * - Fallback UI display
 * - Error recovery (clear error button)
 * - Development console logging
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    // Log error for debugging
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error);
    }
  }

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
          <p className="text-red-700 text-sm mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
          {this.props.fallback || (
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-100 transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
