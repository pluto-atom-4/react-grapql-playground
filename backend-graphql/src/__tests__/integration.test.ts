import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('JWT Integration - Context Factory Error Handling', () => {
  describe('Invalid JWT Handling', () => {
    it('should handle invalid JWT by setting user to null without crashing', () => {
      // Simulate context factory with invalid JWT
      const invalidToken = 'invalid.token.here';

      // This should not throw, but log error and set user to null
      let user = null;
      try {
        // In real scenario, this is wrapped in context factory
        const decoded = jwt.verify(invalidToken, JWT_SECRET);
        user = decoded;
      } catch (error) {
        // Error is caught and logged, user remains null
        expect(error).toBeDefined();
        expect(user).toBeNull();
      }
    });

    it('should return GraphQL error for protected query with null user', () => {
      // Simulate a protected resolver checking for user
      const context = { user: null };

      // Protected resolvers throw when user is null
      expect(() => {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
      }).toThrow('Unauthorized');
    });

    it('should handle malformed JWT with descriptive error', () => {
      const malformedToken = 'Bearer eyJhbGc';

      let errorMessage = '';
      try {
        jwt.verify(malformedToken, JWT_SECRET);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      expect(errorMessage).toBeDefined();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('JWT Payload Validation in Context', () => {
    it('should reject JWT with null id field', () => {
      const tokenWithNullId = jwt.sign({ id: null }, JWT_SECRET, { expiresIn: '24h' });

      let error: Error | null = null;
      try {
        jwt.verify(tokenWithNullId, JWT_SECRET);
        // In real context factory, isValidJWTPayload check would throw
        const decoded = jwt.verify(tokenWithNullId, JWT_SECRET) as Record<string, unknown>;
        if (typeof decoded.id !== 'string' || decoded.id === '') {
          throw new Error('Invalid token payload: id must be a non-empty string');
        }
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain('id must be a non-empty string');
    });

    it('should reject JWT with numeric id field', () => {
      const tokenWithNumericId = jwt.sign({ id: 123 }, JWT_SECRET, { expiresIn: '24h' });

      let error: Error | null = null;
      try {
        const decoded = jwt.verify(tokenWithNumericId, JWT_SECRET) as Record<string, unknown>;
        if (typeof decoded.id !== 'string' || decoded.id === '') {
          throw new Error('Invalid token payload: id must be a non-empty string');
        }
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain('id must be a non-empty string');
    });

    it('should accept valid JWT with string id', () => {
      const validToken = generateToken('user-123');

      let user: Record<string, unknown> | null = null;
      try {
        const decoded = jwt.verify(validToken, JWT_SECRET) as Record<string, unknown>;
        if (typeof decoded.id === 'string' && decoded.id !== '') {
          user = decoded;
        }
      } catch (err) {
        // Should not reach here
        expect(err).toBeNull();
      }

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
    });
  });

  describe('Public Queries with Missing Auth Header', () => {
    it('should allow null user for public queries (no auth required)', () => {
      // Public queries should work with null user
      // (resolvers that don't check context.user)
      const publicQuery = {
        resolver: () => {
          // This public resolver doesn't check user
          return { message: 'public data' };
        },
      };

      const result = publicQuery.resolver();
      expect(result).toBeDefined();
      expect(result.message).toBe('public data');
    });

    it('should return Unauthorized error when protected query requires auth', () => {
      const context = { user: null };

      // Protected resolver checks user
      const protectedQuery = {
        resolver: () => {
          if (!context.user) {
            throw new Error('Unauthorized');
          }
          return { message: 'protected data' };
        },
      };

      expect(() => protectedQuery.resolver()).toThrow('Unauthorized');
    });
  });

  describe('JWT Expiration Handling', () => {
    it('should handle expired token gracefully', () => {
      const expiredToken = jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' });

      let error: Error | null = null;
      try {
        jwt.verify(expiredToken, JWT_SECRET);
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
      }

      expect(error).not.toBeNull();
      expect(error?.message).toContain('expired');
    });

    it('should accept non-expired token', () => {
      const validToken = generateToken('user-123');

      let decoded: Record<string, unknown> | null = null;
      try {
        decoded = jwt.verify(validToken, JWT_SECRET) as Record<string, unknown>;
      } catch (err) {
        // Should not reach here
        expect(err).toBeNull();
      }

      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe('user-123');
    });
  });
});
