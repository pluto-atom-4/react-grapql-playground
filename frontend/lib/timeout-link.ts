/**
 * TimeoutLink: Apollo Link for enforcing GraphQL request timeouts
 *
 * Provides a 10-second hard timeout boundary for all GraphQL operations.
 * Timeout errors are classified as retryable, allowing RetryLink to automatically
 * recover from network delays.
 *
 * Issue #32: Add Timeouts & Retry Logic
 */

import { ApolloLink, Operation, FetchResult } from '@apollo/client';

/**
 * Configuration for TimeoutLink
 */
export interface TimeoutConfig {
  /** Timeout duration in milliseconds (default: 10000ms / 10 seconds) */
  timeout: number;
}

/**
 * TimeoutLink enforces a maximum duration for GraphQL requests.
 *
 * When the timeout is exceeded, an error is thrown and passed to subsequent
 * links (RetryLink, ErrorLink). The error includes "timeout" in its message,
 * which allows RetryLink to classify it as retryable.
 *
 * @example
 * ```typescript
 * const timeoutLink = new TimeoutLink({ timeout: 10000 });
 * const link = timeoutLink.concat(retryLink).concat(errorLink).concat(httpLink);
 * ```
 */
export class TimeoutLink extends ApolloLink {
  private timeout: number;

  /**
   * Creates a new TimeoutLink instance
   *
   * @param config - Configuration object
   * @param config.timeout - Timeout duration in milliseconds (default: 10000)
   */
  constructor(config: TimeoutConfig = { timeout: 10000 }) {
    super();
    this.timeout = config.timeout;
  }

  /**
   * Process the operation with timeout enforcement
   *
   * @param operation - The GraphQL operation
   * @param forward - Function to pass operation to next link
   * @returns Observable-like object that either completes with result or errors with timeout
   */
  public request(operation: Operation, forward: (op: Operation) => any): any {
    // Return an object with a subscribe method that behaves like an Observable
    return {
      subscribe: (handlers: any) => {
        let timeoutId: NodeJS.Timeout | undefined;
        let isSubscriptionCancelled = false;

        // Subscribe to the forward operation
        const subscription = forward(operation).subscribe({
          // Pass through successful responses
          next: (value: FetchResult) => {
            if (!isSubscriptionCancelled) {
              clearTimeout(timeoutId);
              handlers.next?.(value);
            }
          },
          // Pass through errors from downstream links
          error: (err: any) => {
            if (!isSubscriptionCancelled) {
              clearTimeout(timeoutId);
              handlers.error?.(err);
            }
          },
          // Pass through completion
          complete: () => {
            if (!isSubscriptionCancelled) {
              clearTimeout(timeoutId);
              handlers.complete?.();
            }
          },
        });

        // Set timeout that triggers if response takes too long
        timeoutId = setTimeout(() => {
          isSubscriptionCancelled = true;

          // Create timeout error with descriptive message
          const timeoutError = new Error(
            `GraphQL request timeout after ${this.timeout}ms for operation '${operation.operationName}'`
          );

          handlers.error?.(timeoutError);
          subscription.unsubscribe();
        }, this.timeout);

        // Return cleanup function for when subscription is unsubscribed
        return {
          unsubscribe: () => {
            isSubscriptionCancelled = true;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
          },
        };
      },
    };
  }
}
