/**
 * GraphQL Error Handler Utilities - Integration Test
 *
 * This test verifies that the error handler utilities work correctly
 * without requiring ApolloError mocking, using pure JavaScript error types.
 */

import { describe, it, expect } from 'vitest';

import {
  classifyError,
  extractErrorMessage,
  isRetryableError,
  isAuthenticationError,
  isValidationError,
  getExponentialBackoffDelay,
  extractErrorDetails,
  type ErrorType,
} from '../graphql-error-handler';

describe('GraphQL Error Handler - Integration', () => {
  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new TypeError('fetch failed');
      expect(classifyError(networkError)).toBe('network');
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('timeout');
      expect(classifyError(timeoutError)).toBe('timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should classify unknown errors correctly', () => {
      const unknownError = new Error('unknown error');
      expect(classifyError(unknownError)).toBe('unknown');
      expect(isRetryableError(unknownError)).toBe(false);
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract messages from Error objects', () => {
      const error = new Error('Custom error message');
      const message = extractErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should handle unknown error types gracefully', () => {
      expect(extractErrorMessage(null)).toBe('An unknown error occurred');
      expect(extractErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(extractErrorMessage('string')).toBe('An unknown error occurred');
    });
  });

  describe('Backoff Delay Calculation', () => {
    it('should calculate exponential backoff delays', () => {
      const delay0 = getExponentialBackoffDelay(0, 100, 10000);
      const delay1 = getExponentialBackoffDelay(1, 100, 10000);
      const delay2 = getExponentialBackoffDelay(2, 100, 10000);

      // Check ranges (accounting for jitter)
      expect(delay0).toBeGreaterThanOrEqual(100);
      expect(delay0).toBeLessThan(120);

      expect(delay1).toBeGreaterThanOrEqual(200);
      expect(delay1).toBeLessThan(250);

      expect(delay2).toBeGreaterThanOrEqual(400);
      expect(delay2).toBeLessThan(500);
    });

    it('should respect max delay', () => {
      const delay = getExponentialBackoffDelay(10, 100, 500);
      expect(delay).toBeLessThanOrEqual(550);
    });
  });

  describe('Error Details Extraction', () => {
    it('should extract details from standard Error', () => {
      const error = new Error('Test error');
      const details = extractErrorDetails(error);

      expect(details.message).toBe('Test error');
      expect(details.errorType).toBe('unknown');
      expect(details.graphqlErrors).toEqual([]);
    });

    it('should handle null/undefined errors', () => {
      const nullDetails = extractErrorDetails(null);
      expect(nullDetails.message).toBe('An unknown error occurred');
      expect(nullDetails.errorType).toBe('unknown');

      const undefinedDetails = extractErrorDetails(undefined);
      expect(undefinedDetails.message).toBe('An unknown error occurred');
      expect(undefinedDetails.errorType).toBe('unknown');
    });
  });

  describe('Error Type Checks', () => {
    it('should correctly identify non-retryable errors', () => {
      const validationError = new Error('validation');
      expect(isValidationError(validationError)).toBe(false);

      const authError = new Error('unauthorized');
      expect(isAuthenticationError(authError)).toBe(false);
    });

    it('should correctly identify retryable errors', () => {
      const networkError = new Error('network error');
      expect(isRetryableError(networkError)).toBe(true);

      const timeoutError = new Error('timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
    });
  });

  describe('Error Handler Integration', () => {
    it('should classify and extract messages consistently', () => {
      const errors: Array<{ error: unknown; expectedType: ErrorType; shouldRetry: boolean }> = [
        { error: new TypeError('network failed'), expectedType: 'network', shouldRetry: true },
        { error: new Error('timeout'), expectedType: 'timeout', shouldRetry: true },
        { error: new Error('other'), expectedType: 'unknown', shouldRetry: false },
      ];

      for (const { error, expectedType, shouldRetry } of errors) {
        const classified = classifyError(error);
        expect(classified).toBe(expectedType);
        expect(isRetryableError(error)).toBe(shouldRetry);

        const message = extractErrorMessage(error);
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      }
    });
  });

  describe('GraphQL Error Object Support', () => {
    it('should detect GraphQL error objects without mocking ApolloError', () => {
      // Simulate a GraphQL error object structure
      const graphQLError = {
        graphQLErrors: [
          {
            message: 'Query failed',
            extensions: { code: 'INTERNAL_ERROR' },
          },
        ],
      };

      // Since classifyError looks for graphQLErrors property
      const classified = classifyError(graphQLError);
      expect(classified).toBe('graphql');
    });

    it('should extract error codes from GraphQL error objects', () => {
      const validationError = {
        graphQLErrors: [
          {
            message: 'Invalid input',
            extensions: { code: 'BAD_USER_INPUT' },
          },
        ],
      };

      const classified = classifyError(validationError);
      expect(classified).toBe('validation');
    });

    it('should detect unauthorized GraphQL errors', () => {
      const authError = {
        graphQLErrors: [
          {
            message: 'Not authenticated',
            extensions: { code: 'UNAUTHENTICATED' },
          },
        ],
      };

      const classified = classifyError(authError);
      expect(classified).toBe('unauthorized');
      expect(isAuthenticationError(authError)).toBe(true);
    });

    it('should extract messages from GraphQL error objects', () => {
      const error = {
        graphQLErrors: [
          {
            message: 'This is a GraphQL error',
          },
        ],
      };

      const message = extractErrorMessage(error);
      expect(message).toBe('This is a GraphQL error');
    });
  });

  describe('Error Handler No Dependencies Test', () => {
    it('should work without any Apollo Client imports', () => {
      // This test verifies the module exports work correctly
      // and the error handler functions are all available

      const handlers = {
        classifyError,
        extractErrorMessage,
        isRetryableError,
        isAuthenticationError,
        isValidationError,
        getExponentialBackoffDelay,
        extractErrorDetails,
      };

      // Verify all handlers are functions
      for (const [name, handler] of Object.entries(handlers)) {
        expect(typeof handler).toBe('function');
        if (typeof handler !== 'function') {
          throw new Error(`${name} should be a function`);
        }
      }
    });
  });
});
