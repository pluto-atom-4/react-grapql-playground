'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary component that catches render errors in child components.
 *
 * Features:
 * - Catches JavaScript errors during rendering
 * - Displays graceful fallback UI with error message
 * - Includes "Try Again" button for error recovery
 * - Logs errors to console for debugging
 * - Supports custom fallback UI via prop
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallback={(error, reset) => (
 *   <div>
 *     <h1>Custom error UI</h1>
 *     <button onClick={reset}>Reset</button>
 *   </div>
 * )}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * Note: Error boundaries only catch errors in child components, not in:
 * - Event handlers (use try/catch instead)
 * - Async code (use try/catch or Promise.catch())
 * - Error boundary's own render method
 * - Server-side rendering errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error('Error caught by ErrorBoundary:', error)
    console.error('Component stack:', errorInfo.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.handleReset) || (
          <div className="error-boundary-fallback">
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
            <button onClick={this.handleReset} className="error-boundary-reset-btn" type="button">
              Try Again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
