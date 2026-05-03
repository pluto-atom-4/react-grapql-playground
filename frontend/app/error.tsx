'use client'

/**
 * Next.js Error Page (error.tsx)
 *
 * This is a special Next.js file that catches page-level errors within the app directory.
 * It provides a user-friendly error display with recovery options.
 *
 * Features:
 * - Catches errors thrown in page components and layouts
 * - Displays error message and digest for debugging
 * - "Try Again" button to reset error state
 * - Styled error UI consistent with app theme
 *
 * Note: This is automatically used by Next.js when an error occurs in a page or component.
 * It's separate from React's Error Boundary but works in tandem with it.
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.ReactElement {
  return (
    <div className="error-page-container">
      <div className="error-content">
        <h1>Oops! Something went wrong</h1>
        <p className="error-message">{error.message}</p>
        {error.digest && <p className="error-id">Error ID: {error.digest}</p>}
        <button onClick={reset} className="error-reset-button" type="button">
          Try Again
        </button>
      </div>
    </div>
  )
}
