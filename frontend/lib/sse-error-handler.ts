/**
 * SSE Error Handler: Centralized error classification and recovery logic
 *
 * Classifies different types of SSE connection errors and provides:
 * - Error type detection (CORS, timeout, network, protocol)
 * - User-friendly error messages
 * - Error event emission for UI integration
 * - Recovery strategies per error type
 */

export enum SSEErrorType {
  CORS = 'cors',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  PROTOCOL = 'protocol',
  UNKNOWN = 'unknown',
}

export interface SSEErrorContext {
  errorType: SSEErrorType;
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface SSEErrorNotification {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action?: 'retry' | 'refresh' | 'dismiss';
  duration?: number | null; // ms, null = persist
  errorType: SSEErrorType;
}

/**
 * Error type detection strategies
 */
interface ErrorDetectionContext {
  errorEvent?: Event;
  isOnline?: boolean;
  attemptNumber?: number;
  maxAttempts?: number;
  isInitialConnection?: boolean;
  lastSuccessfulConnectionTime?: number;
}

/**
 * Classifies SSE errors into actionable types
 *
 * Detection heuristics:
 * - CORS: Immediate error on initial connection attempt, browser offline detection
 * - TIMEOUT: No successful connection within timeout window
 * - NETWORK: Browser reports offline or DNS/network unavailable
 * - PROTOCOL: JSON parse failures or malformed event data
 * - UNKNOWN: Unclassified error
 */
export function classifySSEError(context: ErrorDetectionContext): SSEErrorType {
  // Network errors have highest priority (most common, easiest to detect)
  if (context.isOnline === false) {
    return SSEErrorType.NETWORK;
  }

  // If initial connection fails immediately, likely CORS
  if (context.isInitialConnection && context.errorEvent) {
    // CORS errors typically fire immediately after attempting connection
    return SSEErrorType.CORS;
  }

  // Timeout detection: If max attempts reached with no success
  if (
    context.attemptNumber !== undefined &&
    context.maxAttempts !== undefined &&
    context.attemptNumber >= context.maxAttempts
  ) {
    // After many retries, likely network or server issue
    return SSEErrorType.TIMEOUT;
  }

  // Default to unknown
  return SSEErrorType.UNKNOWN;
}

/**
 * Generates user-friendly error message based on error type
 *
 * Messages are designed to:
 * - Be non-technical and reassuring
 * - Indicate what's happening (connecting, waiting, etc)
 * - Suggest action if needed
 */
export function getErrorMessage(errorType: SSEErrorType): string {
  const messages: Record<SSEErrorType, string> = {
    [SSEErrorType.CORS]: 'Connection issue detected. Real-time updates are paused. Attempting to reconnect...',
    [SSEErrorType.TIMEOUT]:
      'Connection is taking longer than expected. Waiting for response from server...',
    [SSEErrorType.NETWORK]:
      'You appear to be offline. Real-time updates will resume when your connection is restored.',
    [SSEErrorType.PROTOCOL]:
      'Data format error occurred. Continuing with local updates. Please refresh if issues persist.',
    [SSEErrorType.UNKNOWN]:
      'Connection interrupted. Automatically attempting to reconnect...',
  };

  return messages[errorType] || messages[SSEErrorType.UNKNOWN];
}

/**
 * Creates a user-facing error notification from SSE error
 */
export function createSSEErrorNotification(
  errorType: SSEErrorType,
  attemptNumber?: number,
  maxAttempts?: number
): SSEErrorNotification {
  const isTerminal =
    attemptNumber !== undefined &&
    maxAttempts !== undefined &&
    attemptNumber >= maxAttempts;

  const baseNotification: SSEErrorNotification = {
    type: isTerminal ? 'error' : 'warning',
    title: isTerminal ? 'Real-Time Connection Failed' : 'Real-Time Updates',
    message: getErrorMessage(errorType),
    errorType,
  };

  // Customize based on error type
  switch (errorType) {
    case SSEErrorType.CORS:
      return {
        ...baseNotification,
        type: 'warning',
        duration: 5000,
        action: 'dismiss',
      };

    case SSEErrorType.TIMEOUT:
      if (isTerminal) {
        return {
          ...baseNotification,
          type: 'error',
          message:
            'Unable to establish real-time connection. Please refresh the page to continue.',
          duration: null, // Persist until dismissed
          action: 'refresh',
        };
      }
      return {
        ...baseNotification,
        type: 'info',
        duration: 10000,
        action: 'dismiss',
      };

    case SSEErrorType.NETWORK:
      return {
        ...baseNotification,
        type: 'warning',
        duration: null, // Persist until connection restored
        action: 'dismiss',
      };

    case SSEErrorType.PROTOCOL:
      return {
        ...baseNotification,
        type: 'warning',
        duration: 8000,
        action: 'dismiss',
      };

    default:
      return {
        ...baseNotification,
        type: 'info',
        duration: 5000,
        action: 'dismiss',
      };
  }
}

/**
 * Determines if error should be shown to user (throttle repeated errors)
 */
export class ErrorThrottler {
  private lastErrorType: SSEErrorType | null = null;
  private lastErrorTime: number = 0;
  private throttleDelayMs: number = 5000; // Only show same error once per 5 seconds

  constructor(throttleDelayMs: number = 5000) {
    this.throttleDelayMs = throttleDelayMs;
  }

  /**
   * Check if error should be shown to user (not throttled)
   */
  shouldShowError(errorType: SSEErrorType): boolean {
    const now = Date.now();
    const isSameError = this.lastErrorType === errorType;
    const isWithinThrottleWindow = now - this.lastErrorTime < this.throttleDelayMs;

    // Show error if: different error type, OR first time, OR outside throttle window
    const shouldShow = !isSameError || !isWithinThrottleWindow;

    // Update throttler state
    this.lastErrorType = errorType;
    this.lastErrorTime = now;

    return shouldShow;
  }

  /**
   * Reset throttler (e.g., on successful connection)
   */
  reset(): void {
    this.lastErrorType = null;
    this.lastErrorTime = 0;
  }
}

/**
 * Parses protocol/format errors from event payloads
 */
export function detectProtocolError(data: string | undefined): boolean {
  if (typeof data !== 'string' || data.trim().length === 0) {
    return true;
  }

  try {
    // Attempt to parse as JSON to detect malformed payloads
    JSON.parse(data);
    return false;
  } catch {
    // JSON parse failed
    return true;
  }
}

/**
 * Structured logging for SSE errors (for debugging)
 */
export interface SSEErrorLog {
  timestamp: number;
  errorType: SSEErrorType;
  attemptNumber?: number;
  context?: Record<string, unknown>;
}

export class SSEErrorLogger {
  private logs: SSEErrorLog[] = [];
  private maxLogs: number = 100; // Keep last 100 error logs

  /**
   * Log an SSE error
   */
  logError(
    errorType: SSEErrorType,
    attemptNumber?: number,
    context?: Record<string, unknown>
  ): void {
    this.logs.push({
      timestamp: Date.now(),
      errorType,
      attemptNumber,
      context,
    });

    // Trim logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Optionally expose to window for debugging
    if (typeof window !== 'undefined') {
      window.__SSE_ERROR_LOGS = this.logs;
    }
  }

  /**
   * Get all logged errors
   */
  getLogs(): SSEErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get error summary (count by type)
   */
  getSummary(): Record<SSEErrorType, number> {
    const summary: Record<SSEErrorType, number> = {
      [SSEErrorType.CORS]: 0,
      [SSEErrorType.TIMEOUT]: 0,
      [SSEErrorType.NETWORK]: 0,
      [SSEErrorType.PROTOCOL]: 0,
      [SSEErrorType.UNKNOWN]: 0,
    };

    this.logs.forEach((log) => {
      summary[log.errorType]++;
    });

    return summary;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    if (typeof window !== 'undefined') {
      window.__SSE_ERROR_LOGS = [];
    }
  }
}

/**
 * Global error logger instance (for development/debugging)
 */
export const globalSSEErrorLogger = new SSEErrorLogger();

/**
 * Extend global window to include SSE error logs for debugging
 */
declare global {
  interface Window {
    __SSE_ERROR_LOGS?: SSEErrorLog[];
  }
}
