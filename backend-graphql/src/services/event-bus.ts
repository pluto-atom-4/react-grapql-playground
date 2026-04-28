/**
 * Event Bus Service - Bridges GraphQL mutations to Express event bus
 *
 * This service emits events from GraphQL resolvers to the Express server
 * via HTTP POST with authentication. Express then broadcasts these events
 * to all connected SSE clients.
 *
 * Security: All requests include Authorization header with shared event secret.
 * This prevents event injection attacks from unauthorized clients.
 *
 * Resilience: Implements exponential backoff retry logic to handle transient failures.
 * Failed events are logged but don't throw—mutations should complete even if event bus fails.
 *
 * Flow: GraphQL mutation → HTTP POST (authenticated, with retries) → Express → EventBus.emit() → SSE broadcast → Frontend
 */

interface EventPayload {
  event: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/**
 * HTTP Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number; // Default: 3
  baseDelayMs: number; // Default: 1000 (1s)
  maxDelayMs: number; // Default: 30000 (30s)
  backoffMultiplier: number; // Default: 2
  timeoutMs: number; // Default: 5000 (5s per attempt)
}

/**
 * Calculate backoff delay for retry attempt
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number = 2
): number {
  const delay = baseDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Emits an event from a GraphQL mutation to the Express event bus.
 *
 * Features:
 * - Exponential backoff retry logic (base 1s, max 30s)
 * - Authentication via shared event secret
 * - Per-request timeout (5s default)
 * - Comprehensive error logging
 *
 * Behavior:
 * - Attempt 1: Immediate
 * - Attempt 2: After 1s
 * - Attempt 3: After 2s
 * - Attempt 4: After 4s
 * - If all fail: Log error but don't throw (mutation completes)
 *
 * Manufacturing Security:
 * - Prevents event injection attacks (fake build status, test results)
 * - Ensures only trusted services can trigger real-time updates
 * - Supports manufacturing decision-making with integrity
 */
export async function emitEvent(
  eventName: string,
  payload: Record<string, unknown>,
  retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    timeoutMs: 5000,
  }
): Promise<void> {
  const expressEventUrl = process.env.EXPRESS_EVENT_URL || 'http://localhost:5000/events/emit';
  const eventSecret = process.env.EXPRESS_EVENT_SECRET || 'dev-event-secret-change-in-production';

  const eventPayload: EventPayload = {
    event: eventName,
    payload,
    timestamp: new Date().toISOString(),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const fetchOptions: RequestInit & { signal?: unknown } = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${eventSecret}`,
        },
        body: JSON.stringify(eventPayload),
      };

      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      // Use AbortController if available (Node.js 15+)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (global as any).AbortController === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const controller = new (global as any).AbortController();
        timeoutHandle = setTimeout(() => controller.abort(), retryConfig.timeoutMs);
        fetchOptions.signal = controller.signal;
      }

      const response = await fetch(expressEventUrl, fetchOptions);

      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      if (response.ok) {
        return; // Success
      }

      // Non-2xx response, treat as error
      const responseText = await response.text();
      lastError = new Error(`HTTP ${response.status}: ${responseText}`);
      throw lastError;
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === retryConfig.maxRetries;

      if (isLastAttempt) {
        console.error(
          `[EventBus] Failed to emit event after ${retryConfig.maxRetries} retries: ${eventName}`,
          lastError
        );
        return; // Don't throw, let mutation complete
      }

      // Calculate next delay with exponential backoff (using correct formula)
      const nextDelay = calculateBackoffDelay(
        attempt + 1,
        retryConfig.baseDelayMs,
        retryConfig.maxDelayMs,
        retryConfig.backoffMultiplier
      );

      console.warn(
        `[EventBus] Event emission attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed for ${eventName}`,
        {
          error: lastError.message,
          retryIn: nextDelay,
        }
      );

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }
}
