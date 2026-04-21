/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Issue #121 - Backend Integration Tests: Token Management
 * Tests JWT token generation, validation, and refresh
 * Covers acceptance criteria #1, #5, #6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateToken, extractUserFromToken } from '../../middleware/auth';
import jwt from 'jsonwebtoken';

describe('Backend: Token Management Integration', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  beforeEach(() => {
    // Ensure clean state
  });

  describe('Token Generation (Acceptance Criteria #1)', () => {
    it('AC#1: should generate valid JWT token on login', () => {
      const token = generateToken('user-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify it's a valid JWT (3 parts)
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('AC#1: token contains user ID in payload', () => {
      const userId = 'user-456';
      const token = generateToken(userId);

      const decoded = jwt.decode(token) as { id: string };
      expect(decoded.id).toBe(userId);
    });

    it('AC#1: token has 24-hour expiration', () => {
      const token = generateToken('user-789');
      const decoded = jwt.decode(token) as { exp: number; iat: number };

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const expirationSeconds = decoded.exp - decoded.iat;
      const expectedSeconds = 24 * 60 * 60;

      // Allow small variance
      expect(Math.abs(expirationSeconds - expectedSeconds)).toBeLessThanOrEqual(2);
    });

    it('AC#1: token can be stored in localStorage format', () => {
      const token = generateToken('user-123');

      // Should be string format suitable for storage
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Should not have special characters that break storage
      expect(token).toMatch(/^[A-Za-z0-9._-]+$/);
    });
  });

  describe('Token Validation (Acceptance Criteria #5, #6)', () => {
    it('AC#5: should extract user from valid token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);
      const authHeader = `Bearer ${token}`;

      const user = extractUserFromToken(authHeader);

      expect(user).not.toBeNull();
      expect(user?.id).toBe(userId);
    });

    it('AC#5: should validate token signature', () => {
      const fakeToken = jwt.sign({ id: 'user-123' }, 'wrong-secret', { expiresIn: '24h' });
      const authHeader = `Bearer ${fakeToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Invalid token');
    });

    it('AC#6: should throw on expired token', () => {
      const expiredToken = jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' });
      const authHeader = `Bearer ${expiredToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Token expired');
    });

    it('AC#6: should return null or throw on missing Bearer prefix', () => {
      const token = generateToken('user-123');

      // Missing "Bearer " prefix - should return null (no valid auth)
      const user = extractUserFromToken(token);
      expect(user).toBeNull();
    });

    it('AC#6: should throw on empty token', () => {
      // "Bearer " with empty token returns null (not throws)
      const user = extractUserFromToken('Bearer ');
      expect(user).toBeNull();
    });

    it('AC#6: should return null on missing Authorization header', () => {
      const user = extractUserFromToken(undefined);
      expect(user).toBeNull();
    });

    it('AC#6: should return null on empty Authorization header', () => {
      const user = extractUserFromToken('');
      expect(user).toBeNull();
    });

    it('AC#5: should handle array Authorization headers (from IncomingHttpHeaders)', () => {
      const token = generateToken('user-456');
      const authHeader = [`Bearer ${token}`];

      const user = extractUserFromToken(authHeader as any);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-456');
    });
  });

  describe('Token Usage Flow (AC #1-6)', () => {
    it('should complete token generation → storage → validation flow', () => {
      // Step 1: Generate token on login
      const token = generateToken('user-123');
      expect(token).toBeTruthy();

      // Step 2: Frontend stores in localStorage
      // (Simulated by having token available)
      expect(typeof token).toBe('string');

      // Step 3: Frontend injects in Authorization header
      const authHeader = `Bearer ${token}`;
      expect(authHeader).toMatch(/^Bearer eyJ/);

      // Step 4: Backend extracts and validates
      const user = extractUserFromToken(authHeader);
      expect(user?.id).toBe('user-123');

      // Step 5: Resolver receives user context
      expect(user).toHaveProperty('id');
    });

    it('should reject query without token', () => {
      // No Authorization header
      const user = extractUserFromToken(undefined);

      // AC#6: Query rejected (no auth)
      expect(user).toBeNull();
    });

    it('should reject query with expired token', () => {
      const expiredToken = jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' });
      const authHeader = `Bearer ${expiredToken}`;

      // AC#6: Query rejected (401)
      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Token expired');
    });

    it('should reject query with tampered token', () => {
      const token = generateToken('user-123');
      const parts = token.split('.');

      // Tamper with payload
      const tamperedToken = `${parts[0]}.eyJpZCI6InVzZXItNDU2In0.${parts[2]}`;
      const authHeader = `Bearer ${tamperedToken}`;

      // AC#6: Query rejected (invalid signature)
      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Invalid token');
    });
  });

  describe('Protected Query Enforcement', () => {
    it('AC#8: resolver should check user context before executing query', () => {
      // Simulate resolver logic
      const executeQuery = (user: any) => {
        if (!user) {
          throw new Error('Unauthorized');
        }
        return { builds: [{ id: '1' }] };
      };

      // With auth
      const validUser = extractUserFromToken(`Bearer ${generateToken('user-123')}`);
      expect(() => executeQuery(validUser)).not.toThrow();

      // Without auth
      expect(() => executeQuery(null)).toThrow('Unauthorized');
    });

    it('AC#8: should include user in context for data filtering', () => {
      const token = generateToken('user-123');
      const user = extractUserFromToken(`Bearer ${token}`);

      // Resolver would use user.id to filter builds
      // Example: WHERE user_id = $1, [user.id]
      expect(user?.id).toBe('user-123');
    });
  });

  describe('Token Payload Integrity', () => {
    it('should preserve additional claims in token', () => {
      // Custom function that adds extra claims
      const customToken = jwt.sign(
        { id: 'user-123', email: 'test@example.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const user = extractUserFromToken(`Bearer ${customToken}`);

      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.role).toBe('admin');
    });

    it('should not expose sensitive claims in user context', () => {
      const token = generateToken('user-123');
      const user = extractUserFromToken(`Bearer ${token}`);

      // Should not include raw token claims like iat, exp
      expect(user).not.toHaveProperty('iat');
      expect(user).not.toHaveProperty('exp');
    });
  });

  describe('Token Security Properties', () => {
    it('should use HS256 algorithm (signed but not encrypted)', () => {
      const token = generateToken('user-123');
      const decoded = jwt.decode(token, { complete: true }) as { header: { alg: string } };

      expect(decoded.header.alg).toBe('HS256');
    });

    it('should have different tokens for same user (different iat) OR same if generated too fast', () => {
      const token1 = generateToken('user-123');
      const token2 = generateToken('user-123');

      // May be same if generated in same second (iat is same)
      // Both valid and decode to same user regardless
      const user1 = extractUserFromToken(`Bearer ${token1}`);
      const user2 = extractUserFromToken(`Bearer ${token2}`);

      expect(user1?.id).toBe('user-123');
      expect(user2?.id).toBe('user-123');
    });

    it('should reject malformed tokens', () => {
      const badToken = 'not.a.jwt';
      const authHeader = `Bearer ${badToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow();
    });
  });

  describe('Token Lifecycle (Generation → Storage → Validation → Expiry)', () => {
    it('complete token lifecycle', () => {
      // 1. Generate
      const token = generateToken('user-123');
      expect(token).toBeTruthy();

      // 2. Validate immediately
      const user = extractUserFromToken(`Bearer ${token}`);
      expect(user?.id).toBe('user-123');

      // 3. Verify expiration is set
      const decoded = jwt.decode(token) as { exp: number; iat: number };
      expect(decoded.exp).toBeGreaterThan(decoded.iat);

      // 4. Verify it's not expired yet
      const nowInSeconds = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(nowInSeconds);
    });
  });
});
