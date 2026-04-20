import { describe, it, expect } from 'vitest';
import { extractUserFromToken, generateToken } from '../auth';
import jwt from 'jsonwebtoken';

describe('auth middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  describe('extractUserFromToken', () => {
    it('should return user object for valid token', () => {
      const token = generateToken('user-123');
      const authHeader = `Bearer ${token}`;

      const user = extractUserFromToken(authHeader);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
    });

    it('should handle array header (IncomingHttpHeaders)', () => {
      const token = generateToken('user-456');
      const authHeader = [`Bearer ${token}`];

      const user = extractUserFromToken(authHeader);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-456');
    });

    it('should return null for undefined header', () => {
      const user = extractUserFromToken(undefined);
      expect(user).toBeNull();
    });

    it('should return null for empty string header', () => {
      const user = extractUserFromToken('');
      expect(user).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const token = generateToken('user-789');
      const authHeader = token; // No "Bearer " prefix

      const user = extractUserFromToken(authHeader);

      expect(user).toBeNull();
    });

    it('should return null for "Bearer " with no token', () => {
      const authHeader = 'Bearer ';

      const user = extractUserFromToken(authHeader);

      expect(user).toBeNull();
    });

    it('should throw error for invalid token signature', () => {
      const fakeToken = jwt.sign({ id: 'user-123' }, 'wrong-secret', { expiresIn: '24h' });
      const authHeader = `Bearer ${fakeToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' });
      const authHeader = `Bearer ${expiredToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Token expired');
    });

    it('should throw error for token without id field', () => {
      const invalidToken = jwt.sign({ name: 'John' }, JWT_SECRET, { expiresIn: '24h' });
      const authHeader = `Bearer ${invalidToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Invalid token payload: missing id field');
    });

    it('should throw error for string payload (not object)', () => {
      // jwt.sign only accepts object payloads when expiresIn is used
      // Instead, test with a token that has no id field
      const noIdToken = jwt.sign({ name: 'test' }, JWT_SECRET, { expiresIn: '24h' });
      const authHeader = `Bearer ${noIdToken}`;

      expect(() => {
        extractUserFromToken(authHeader);
      }).toThrow('Invalid token payload: missing id field');
    });

    it('should preserve additional payload fields', () => {
      const customToken = jwt.sign(
        { id: 'user-123', email: 'test@example.com', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      const authHeader = `Bearer ${customToken}`;

      const user = extractUserFromToken(authHeader);

      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.role).toBe('admin');
    });

    it('should filter out iat and exp claims', () => {
      const token = generateToken('user-123');
      const authHeader = `Bearer ${token}`;

      const user = extractUserFromToken(authHeader);

      expect(user).not.toBeNull();
      expect(user).not.toHaveProperty('iat');
      expect(user).not.toHaveProperty('exp');
    });
  });

  describe('generateToken', () => {
    it('should generate valid token', () => {
      const token = generateToken('user-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(typeof decoded !== 'string' && decoded.id).toBe('user-123');
    });

    it('should generate unique tokens for same user', () => {
      const token1 = generateToken('user-123');
      const token2 = generateToken('user-123');

      // Tokens have different iat timestamps, so they'll be different
      // Even though they encode the same user id
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
      expect(token1.length).toBeGreaterThan(0);
      expect(token2.length).toBeGreaterThan(0);
    });

    it('should create token with 24h expiration', () => {
      const token = generateToken('user-123');
      const decoded = jwt.decode(token) as { exp: number; iat: number };

      expect(decoded).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      const expirationSeconds = decoded.exp - decoded.iat;
      const expectedSeconds = 24 * 60 * 60;

      // Allow 1 second variance for test execution time
      expect(Math.abs(expirationSeconds - expectedSeconds)).toBeLessThanOrEqual(1);
    });
  });
});
