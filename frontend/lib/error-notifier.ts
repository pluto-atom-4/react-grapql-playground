/**
 * Error Notifier Hook
 *
 * Provides a centralized interface for displaying toast notifications
 * across the application. This module re-exports the useToast hook from
 * the toast-notification component for convenient import.
 *
 * Usage:
 * ```typescript
 * import { useToast } from '@/lib/error-notifier'
 *
 * export function MyComponent() {
 *   const toast = useToast()
 *
 *   const handleClick = async () => {
 *     try {
 *       await someOperation()
 *       toast.success('Operation completed!')
 *     } catch (error) {
 *       toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
 *     }
 *   }
 * }
 * ```
 */

export { useToast } from '@/components/toast-notification';

/**
 * Utility function to extract user-friendly error message from various error types
 * @param error - The error object to extract message from
 * @returns A string representation of the error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return 'An unknown error occurred';
}
