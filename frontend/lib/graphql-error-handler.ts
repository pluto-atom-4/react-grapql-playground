/**
 * GraphQL Error Handler Utilities
 *
 * Provides error classification, extraction, and retry logic for Apollo GraphQL operations.
 * Works without ApolloError dependency, compatible with Apollo Client 4.0 error handling.
 *
 * Features:
 * - Error classification (network, graphql, timeout, validation, unauthorized, unknown)
 * - User-friendly message extraction
 * - Exponential backoff with jitter for retries
 * - Error details extraction for logging and monitoring
 *
 * @module graphql-error-handler
 */

/**
 * Error classification type.
 */
export type ErrorType =
  | 'network'
  | 'graphql'
  | 'timeout'
  | 'validation'
  | 'unauthorized'
  | 'unknown';

/**
 * Classifies an error into categories for appropriate handling.
 * Works with any error object, not just ApolloError.
 *
 * @param error - The error to classify
 * @returns The error classification
 *
 * @example
 * const type = classifyError(new Error('Network request failed'));
 * // => 'network'
 */
export function classifyError(error: unknown): ErrorType {
  if (!error) return 'unknown';

  const errorObj = error as Record<string, unknown>;

  // Check for GraphQL errors first (Apollo format: { graphQLErrors: [...] })
  if (Array.isArray(errorObj.graphQLErrors) && errorObj.graphQLErrors.length > 0) {
    const graphQLErrors = errorObj.graphQLErrors as Array<Record<string, unknown>>;

    for (const err of graphQLErrors) {
      const extensions = err.extensions as Record<string, unknown>;
      if (!extensions) continue;

      const code = extensions.code as string;

      if (code === 'UNAUTHENTICATED') {
        return 'unauthorized';
      }

      if (code === 'BAD_USER_INPUT') {
        return 'validation';
      }
    }

    return 'graphql';
  }

  // Check for network errors
  if (
    errorObj.message?.toString().includes('Network') ||
    errorObj.message?.toString().includes('network') ||
    errorObj.message?.toString().includes('fetch') ||
    errorObj.networkError
  ) {
    return 'network';
  }

  // Check for timeout errors
  if (
    errorObj.message?.toString().includes('timeout') ||
    errorObj.message?.toString().includes('Timeout')
  ) {
    return 'timeout';
  }

  return 'unknown';
}

/**
 * Extracts a user-friendly error message from various error types.
 * Prioritizes GraphQL error messages over generic ones.
 *
 * @param error - The error to extract from
 * @returns User-friendly error message
 *
 * @example
 * const message = extractErrorMessage(graphqlError);
 * // => "Invalid email format"
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorObj = error as Record<string, unknown>;

  // Try GraphQL errors first
  if (Array.isArray(errorObj.graphQLErrors) && errorObj.graphQLErrors.length > 0) {
    const graphQLErrors = errorObj.graphQLErrors as Array<Record<string, unknown>>;
    const firstError = graphQLErrors[0];

    if (firstError?.message && typeof firstError.message === 'string') {
      return firstError.message;
    }
  }

  // Fallback to standard error message
  if (errorObj.message && typeof errorObj.message === 'string') {
    return errorObj.message;
  }

  // Last resort
  return 'An unknown error occurred';
}

/**
 * Determines if an error is authentication-related.
 *
 * @param error - The error to check
 * @returns True if error is authentication-related
 */
export function isAuthenticationError(error: unknown): boolean {
  const errorType = classifyError(error);
  return errorType === 'unauthorized';
}

/**
 * Determines if an error is validation-related.
 *
 * @param error - The error to check
 * @returns True if error is validation-related
 */
export function isValidationError(error: unknown): boolean {
  const errorType = classifyError(error);
  return errorType === 'validation';
}

/**
 * Determines if an error is retryable based on classification.
 *
 * @param error - The error to check
 * @returns True if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  const errorType = classifyError(error);
  return errorType === 'network' || errorType === 'timeout';
}

/**
 * Calculates exponential backoff delay with jitter.
 * Formula: min(baseDelay * 2^attempt + random(0, jitterPercent% of baseDelay), maxDelay)
 *
 * @param attempt - The attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 100)
 * @param maxDelay - Maximum delay cap in milliseconds (default: 30000)
 * @param jitterPercent - Jitter percentage (default: 10%)
 * @returns Delay in milliseconds
 *
 * @example
 * const delay = getExponentialBackoffDelay(0); // ~100-110ms
 * const delay = getExponentialBackoffDelay(1); // ~200-220ms
 * const delay = getExponentialBackoffDelay(2); // ~400-440ms
 */
export function getExponentialBackoffDelay(
  attempt: number,
  baseDelay: number = 100,
  maxDelay: number = 30000,
  jitterPercent: number = 10
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = (Math.random() * baseDelay * jitterPercent) / 100;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Comprehensive error details extracted from various error types.
 * Used for logging, monitoring, and user feedback.
 */
export interface ErrorDetails {
  /** User-friendly message */
  message: string;

  /** Error classification */
  errorType: ErrorType;

  /** GraphQL errors array (if present) */
  graphqlErrors: Array<Record<string, unknown>>;
}

/**
 * Extracts comprehensive error details for logging and user feedback.
 * Combines classification, message, and GraphQL error info.
 *
 * @param error - The error to extract details from
 * @returns Comprehensive error details
 *
 * @example
 * const details = extractErrorDetails(error);
 * console.log(details.message); // Show to user
 * console.error(details); // Log full details
 */
export function extractErrorDetails(error: unknown): ErrorDetails {
  const message = extractErrorMessage(error);
  const errorType = classifyError(error);

  const errorObj = error as Record<string, unknown> | null;
  const graphqlErrors =
    errorObj && Array.isArray(errorObj.graphQLErrors)
      ? (errorObj.graphQLErrors as Array<Record<string, unknown>>)
      : [];

  return {
    message,
    errorType,
    graphqlErrors,
  };
}
