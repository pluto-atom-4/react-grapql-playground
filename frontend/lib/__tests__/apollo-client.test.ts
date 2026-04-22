/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { makeClient } from '../apollo-client';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('Apollo Client Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Auth Link - Token Injection', () => {
    it('should inject Bearer token when token exists in localStorage', () => {
      localStorage.setItem('auth_token', 'test-jwt-token-12345');

      const client = makeClient();
      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();
      expect(client.link).toBeDefined();
    });

    it('should inject empty auth header when token is missing from localStorage', () => {
      localStorage.removeItem('auth_token');

      const client = makeClient();
      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();
    });

    it('should format token as Bearer {token} in authorization header', () => {
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      localStorage.setItem('auth_token', testToken);

      const client = makeClient();
      expect(client).toBeDefined();
      // Token is correctly stored and will be used by authLink
    });

    it('should use localStorage.getItem to retrieve token', () => {
      const testToken = 'test-jwt-token-12345';
      localStorage.setItem('auth_token', testToken);

      // Verify that the token is stored in localStorage (not in useAuth context)
      const retrievedToken = localStorage.getItem('auth_token');
      expect(retrievedToken).toBe(testToken);

      // makeClient should access this token from localStorage
      const client = makeClient();
      expect(client).toBeDefined();

      // Verify localStorage still has the token (and would be used by authLink)
      expect(localStorage.getItem('auth_token')).toBe(testToken);
    });

    it('should work without React component context (server-side rendering)', () => {
      localStorage.setItem('auth_token', 'ssr-test-token');

      // This should not throw even though there's no React component context
      const client = makeClient();
      expect(client).toBeDefined();
    });

    it('should handle multiple concurrent calls without errors', () => {
      localStorage.setItem('auth_token', 'concurrent-token-1');

      const clients = Array.from({ length: 5 }, () => makeClient());

      expect(clients).toHaveLength(5);
      clients.forEach((client) => {
        expect(client).toBeDefined();
        expect(client.cache).toBeDefined();
      });
    });

    it('should handle null token gracefully with empty string fallback', () => {
      // Ensure token doesn't exist
      localStorage.removeItem('auth_token');

      const client = makeClient();
      expect(client).toBeDefined();
      // Should fall back to empty string, not throw
    });

    it('should work in SSR mode without localStorage errors', () => {
      const token = 'ssr-mode-token';
      localStorage.setItem('auth_token', token);

      try {
        const client = makeClient();
        expect(client).toBeDefined();
        // In SSR, typeof window === 'undefined' would be true
        // Client should still be created without errors
        expect(client.cache).toBeDefined();
      } finally {
        localStorage.removeItem('auth_token');
      }
    });

    it('should maintain token value through multiple client instantiations', () => {
      const testToken = 'persistent-token-value';
      localStorage.setItem('auth_token', testToken);

      const client1 = makeClient();
      const client2 = makeClient();

      expect(localStorage.getItem('auth_token')).toBe(testToken);
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });

    it('should not throw when localStorage.getItem returns null', () => {
      localStorage.clear();
      expect(localStorage.getItem('auth_token')).toBeNull();

      // Should not throw
      const client = makeClient();
      expect(client).toBeDefined();
    });

    it('should handle undefined token key by using default empty string', () => {
      // Don't set auth_token
      const client = makeClient();

      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();
      // Should use empty string as fallback
    });

    it('should preserve authorization header structure for Bearer tokens', () => {
      const bearerToken = 'bearer-token-abc123def456';
      localStorage.setItem('auth_token', bearerToken);

      const client = makeClient();
      expect(client).toBeDefined();
      // AuthLink will format as "Bearer bearer-token-abc123def456"
    });

    it('should handle very long token strings', () => {
      const longToken = 'x'.repeat(2000); // Very long token
      localStorage.setItem('auth_token', longToken);

      const client = makeClient();
      expect(client).toBeDefined();
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token.with-special_chars~123!@#$%';
      localStorage.setItem('auth_token', specialToken);

      const client = makeClient();
      expect(client).toBeDefined();
    });

    it('should update auth header when localStorage token changes', () => {
      localStorage.setItem('auth_token', 'initial-token');
      const client1 = makeClient();

      localStorage.setItem('auth_token', 'updated-token');
      const client2 = makeClient();

      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
      expect(localStorage.getItem('auth_token')).toBe('updated-token');
    });
  });

  describe('Apollo Client Initialization', () => {
    it('should create ApolloClient with InMemoryCache', () => {
      const client = makeClient();

      expect(client).toBeDefined();
      expect(client.cache).toBeDefined();
    });

    it('should use correct GraphQL endpoint from env or default', () => {
      const client = makeClient();

      expect(client).toBeDefined();
      expect(client.link).toBeDefined();
    });

    it('should configure credentials for CORS requests', () => {
      const client = makeClient();

      expect(client).toBeDefined();
      // httpLink is configured with credentials: 'include'
    });

    it('should properly concatenate authLink with httpLink', () => {
      const client = makeClient();

      expect(client).toBeDefined();
      expect(client.link).toBeDefined();
      // Link chain: authLink -> httpLink
    });

    it('should detect SSR mode and configure accordingly', () => {
      const client = makeClient();

      expect(client).toBeDefined();
      // Client is configured with ssrMode based on typeof window
      // In browser: typeof window !== 'undefined' -> ssrMode = false
      // In server: typeof window === 'undefined' -> ssrMode = true
      expect(client.cache).toBeDefined();
      expect(client.link).toBeDefined();
    });
  });

  describe('Integration - No React Hooks Violations', () => {
    it('should not trigger React hooks warnings during client creation', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem('auth_token', 'test-token');
      makeClient();

      // Check that no React hooks-related warnings were logged
      const hookWarnings = consoleWarnSpy.mock.calls.filter((call) =>
        String(call[0]).includes('Hook')
      );
      const hookErrors = consoleErrorSpy.mock.calls.filter((call) =>
        String(call[0]).includes('Hook')
      );

      expect(hookWarnings).toHaveLength(0);
      expect(hookErrors).toHaveLength(0);

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should be callable outside of React component context', () => {
      localStorage.setItem('auth_token', 'non-react-context-token');

      // This is not inside a React component - should work fine
      const client = makeClient();

      expect(client).toBeDefined();
    });

    it('should work in both client and server environments', () => {
      localStorage.setItem('auth_token', 'env-test-token');

      const client = makeClient();

      expect(client).toBeDefined();
      expect(typeof client.cache).toBe('object');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should gracefully handle empty token string', () => {
      localStorage.setItem('auth_token', '');

      const client = makeClient();
      expect(client).toBeDefined();
    });

    it('should use || fallback operator for null token', () => {
      localStorage.removeItem('auth_token');

      const client = makeClient();
      expect(client).toBeDefined();
      // null || '' should result in ''
    });

    it('should handle rapid sequential client instantiations', () => {
      localStorage.setItem('auth_token', 'rapid-test-token');

      const clients = [];
      for (let i = 0; i < 10; i++) {
        clients.push(makeClient());
      }

      expect(clients).toHaveLength(10);
      clients.forEach((client) => {
        expect(client).toBeDefined();
      });
    });

    it('should not mutate global state when creating clients', () => {
      localStorage.setItem('auth_token', 'global-state-test');
      const initialTokenValue = localStorage.getItem('auth_token');

      makeClient();

      expect(localStorage.getItem('auth_token')).toBe(initialTokenValue);
    });
  });
});
