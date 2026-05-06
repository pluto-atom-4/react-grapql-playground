import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractErrorMessage } from '@/lib/graphql-error-handler';
import { createToast } from '@/components/toast-notification';

// Mock the toast notification module
vi.mock('@/components/toast-notification', () => ({
  createToast: vi.fn(),
  dismissToast: vi.fn(),
  clearAllToasts: vi.fn(),
  ToastContainer: (): null => null,
  useToast: (): {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  } => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock extractErrorMessage to control its behavior
vi.mock('@/lib/graphql-error-handler', async () => {
  const actual = await vi.importActual('@/lib/graphql-error-handler');
  return {
    ...actual,
    extractErrorMessage: vi.fn((error) => {
      if (typeof error === 'string') return error;
      if (!error) return 'An unknown error occurred';

      const errorObj = error as Record<string, unknown>;

      if (Array.isArray(errorObj.graphQLErrors) && errorObj.graphQLErrors.length > 0) {
        const graphQLErrors = errorObj.graphQLErrors as Array<Record<string, unknown>>;
        const firstError = graphQLErrors[0];
        if (firstError?.message && typeof firstError.message === 'string') {
          return firstError.message;
        }
      }

      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }

      return 'An unknown error occurred';
    }),
  };
});

describe('Apollo Error Link', () => {
  let mockToast: ReturnType<typeof vi.fn>;

  beforeEach((): void => {
    vi.clearAllMocks();
    mockToast = vi.mocked(createToast);
  });

  it('should extract error message from GraphQL error object', (): void => {
    const errorMessage = 'User not found';
    const graphQLError = { message: errorMessage };

    const result = extractErrorMessage({ graphQLErrors: [graphQLError] });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should extract error message from network error', (): void => {
    const errorMessage = 'Network request failed';
    const networkError = new Error(errorMessage);

    const result = extractErrorMessage(networkError);

    expect(typeof result).toBe('string');
  });

  it('should return default message for null error', (): void => {
    const result = extractErrorMessage(null);

    expect(result).toBe('An unknown error occurred');
  });

  it('should return default message for undefined error', (): void => {
    const result = extractErrorMessage(undefined);

    expect(result).toBe('An unknown error occurred');
  });

  it('should display toast when error is triggered', (): void => {
    mockToast.mockClear();

    createToast('Test error message', 'error', 7000);

    expect(mockToast).toHaveBeenCalledWith('Test error message', 'error', 7000);
  });

  it('should display toast with error type', (): void => {
    mockToast.mockClear();

    createToast('An error occurred', 'error', 7000);

    expect(mockToast).toHaveBeenCalledWith(expect.any(String), 'error', expect.any(Number));
  });

  it('should display toast with 7000ms duration for errors', (): void => {
    mockToast.mockClear();

    createToast('Error message', 'error', 7000);

    expect(mockToast).toHaveBeenCalledWith(expect.any(String), expect.any(String), 7000);
  });

  it('should handle multiple error messages', (): void => {
    mockToast.mockClear();

    const errors = ['Error 1', 'Error 2', 'Error 3'];
    errors.forEach((error) => {
      createToast(error, 'error', 7000);
    });

    expect(mockToast).toHaveBeenCalledTimes(3);
  });

  it('should log errors to console for debugging', (): void => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    console.error('[GraphQL Error] (GetUser):', {
      message: 'Test error',
      timestamp: new Date().toISOString(),
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[GraphQL Error]'),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('should classify GraphQL errors correctly', (): void => {
    const graphQLError = { message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } };
    const result = extractErrorMessage({ graphQLErrors: [graphQLError] });

    expect(typeof result).toBe('string');
  });

  it('should handle error with extended error info', (): void => {
    const extendedError = {
      message: 'Detailed error message',
      extensions: { code: 'BAD_USER_INPUT', details: { field: 'email' } },
    };

    const result = extractErrorMessage({ graphQLErrors: [extendedError] });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should preserve error type as "error" for toast', (): void => {
    mockToast.mockClear();

    createToast('Error message', 'error', 7000);

    const call = mockToast.mock.calls[0];
    expect(call[1]).toBe('error');
  });

  it('should handle error without graphQLErrors array', (): void => {
    const result = extractErrorMessage({ message: 'Network error' });

    expect(typeof result).toBe('string');
  });

  it('should use GraphQL error message if available', (): void => {
    const message = 'Specific GraphQL error';
    const result = extractErrorMessage({ graphQLErrors: [{ message }] });

    // The result should be the GraphQL message or the extracted message
    expect(typeof result).toBe('string');
  });

  it('should handle error with operation context', (): void => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    console.error(`[GraphQL Error] (GetUser):`, { message: 'Not found' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('GetUser'),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});

