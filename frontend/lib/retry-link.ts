/**
 * RetryLink: Apollo Link for automatic request retry with exponential backoff
 *
 * Automatically retries failed GraphQL operations up to 3 times with exponential
 * backoff delays (300ms, 600ms, 1200ms). Intelligently classifies errors:
 * - Retries: Network errors, timeouts, 5xx server errors
 * - Doesn't retry: 4xx client errors, GraphQL validation errors
 *
 * Issue #32: Add Timeouts & Retry Logic
 */

import { ApolloLink, Operation, FetchResult } from '@apollo/client';
import {
  getRetryStrategy,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
} from './graphql-error-handler';

/**
 * RetryLink automatically retries failed operations using intelligent
 * error classification and exponential backoff.
 *
 * Error Classification:
 * - Retryable: Network errors, timeouts (message includes "timeout"), 5xx errors
 * - Non-retryable: 4xx errors, GraphQL validation errors
 *
 * Backoff Strategy:
 * - Attempt 1: Immediate (no delay)
 * - Retry 1: 100ms ± 20% jitter
 * - Retry 2: 200ms ± 20% jitter
 * - Retry 3: 400ms ± 20% jitter
 * - Retry 4+: Capped at 10 seconds
 *
 * @example
 * ```typescript
 * const retryLink = new RetryLink({ maxRetries: 3 });
 * const link = timeoutLink.concat(retryLink).concat(errorLink).concat(httpLink);
 * ```
 */
export class RetryLink extends ApolloLink {
  private config: RetryConfig;

  /**
   * Creates a new RetryLink instance
   *
   * @param config - Partial retry configuration (uses defaults for unspecified values)
   * @param config.maxRetries - Maximum retry attempts (default: 3)
   * @param config.baseDelay - Base delay in ms (default: 100)
   * @param config.maxDelay - Maximum delay cap in ms (default: 10000)
   * @param config.jitterPercent - Jitter range in % (default: 20 for ±20%)
   */
  constructor(config: Partial<RetryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Process the operation with retry logic
   *
   * @param operation - The GraphQL operation
   * @param forward - Function to pass operation to next link
   * @returns Observable-like object that retries on retryable errors
   */
  public request(operation: Operation, forward: (op: Operation) => any): any {
    return {
      subscribe: (subscriber: any) => {
        let attempt = 0;

        /**
         * Execute the operation, with built-in retry logic on errors
         */
        const executeRequest = () => {
          // Subscribe to the operation from the next link
          const subscription = forward(operation).subscribe({
            // Pass through successful responses immediately
            next: (value: FetchResult) => {
              subscriber.next?.(value);
            },
            // Handle errors: determine if we should retry
            error: (err: unknown) => {
              // Check retry strategy: should we retry and with what delay?
              const { shouldRetry, delayMs } = getRetryStrategy(err, attempt, this.config);

              if (shouldRetry) {
                // Increment attempt counter for next retry
                attempt += 1;

                // Log retry attempt with details
                console.log(
                  `[Apollo Retry] Attempt ${attempt}/${this.config.maxRetries} ` +
                    `for ${operation.operationName} after ${delayMs}ms delay`
                );

                // Schedule retry after delay
                setTimeout(() => {
                  executeRequest();
                }, delayMs);
              } else {
                // Max retries exceeded or error is not retryable
                // Pass error to downstream links (ErrorLink, etc.)
                subscriber.error?.(err);
              }
            },
            // Pass through completion
            complete: () => {
              subscriber.complete?.();
            },
          });

          // Return subscription for cleanup
          return subscription;
        };

        // Execute the initial request
        return executeRequest();
      },
    };
  }
}
