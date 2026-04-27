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
 * Formula: min(baseDelay * 2^attempt + random(-jitterPercent% to +jitterPercent% of baseDelay), maxDelay)
 *
 * @param attempt - The attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 100)
 * @param maxDelay - Maximum delay cap in milliseconds (default: 10000 for 10s)
 * @param jitterPercent - Jitter percentage ±range (default: 20% for ±20%)
 * @returns Delay in milliseconds
 *
 * @example
 * const delay = getExponentialBackoffDelay(0); // ~80-120ms (100ms ±20%)
 * const delay = getExponentialBackoffDelay(1); // ~160-240ms (200ms ±20%)
 * const delay = getExponentialBackoffDelay(2); // ~320-480ms (400ms ±20%)
 * const delay = getExponentialBackoffDelay(3); // ~6400-9600ms (capped at 10s)
 */
export function getExponentialBackoffDelay(
  attempt: number,
  baseDelay: number = 100,
  maxDelay: number = 10000,
  jitterPercent: number = 20
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Jitter: ±jitterPercent (e.g., ±20% means -20% to +20%)
  const jitterAmount = (exponentialDelay * jitterPercent) / 100;
  const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
  return Math.min(Math.max(exponentialDelay + jitter, 0), maxDelay);
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

/**
 * Retry configuration for mutations
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterPercent: number;
}

/**
 * Default retry configuration matching spec: 100ms initial, 10s max, ±20% jitter, max 3 retries
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 10000,
  jitterPercent: 20,
};

/**
 * Determines if error should trigger a retry and calculates delay
 *
 * @param error - The error that occurred
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration (uses defaults if not provided)
 * @returns Object with shouldRetry boolean and delayMs for retry timing
 *
 * @example
 * const { shouldRetry, delayMs } = getRetryStrategy(error, 0);
 * if (shouldRetry && delayMs < 10000) {
 *   // Retry after delay
 * }
 */
export function getRetryStrategy(
  error: unknown,
  attempt: number,
  config: Partial<RetryConfig> = {}
): { shouldRetry: boolean; delayMs: number } {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // Don't retry if max attempts exceeded
  if (attempt >= finalConfig.maxRetries) {
    return { shouldRetry: false, delayMs: 0 };
  }

  // Only retry if error is retryable
  if (!isRetryableError(error)) {
    return { shouldRetry: false, delayMs: 0 };
  }

  const delayMs = getExponentialBackoffDelay(
    attempt,
    finalConfig.baseDelay,
    finalConfig.maxDelay,
    finalConfig.jitterPercent
  );

  return { shouldRetry: true, delayMs };
}

