/**
 * JWT Authentication Middleware for GraphQL
 *
 * Extracts and validates JWT tokens from Authorization headers.
 * Returns user object if valid, or null if no token provided.
 * Throws error if token is invalid or expired.
 *
 * Pattern: Authorization: Bearer <token>
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * User object extracted from JWT token
 */
export interface AuthUser {
  id: string;
  [key: string]: unknown;
}

/**
 * Type guard to validate JWT payload structure.
 * Ensures decoded token has id field that is a non-empty string.
 */
export function isValidJWTPayload(decoded: unknown): decoded is { id: string } {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'id' in decoded &&
    typeof (decoded as Record<string, unknown>).id === 'string' &&
    (decoded as Record<string, unknown>).id !== ''
  );
}

/**
 * Extract and validate JWT token from Authorization header.
 * Returns user object if token is valid, null if no token provided.
 * Throws error if token is invalid or expired.
 *
 * Handles IncomingHttpHeaders where Authorization can be string | string[] | undefined
 */
export function extractUserFromToken(
  authHeader: string | string[] | undefined
): AuthUser | null {
  // Handle IncomingHttpHeaders array case
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  // Return null if no header or doesn't start with "Bearer "
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  // Extract token (everything after "Bearer ")
  const token = header.substring(7);

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate payload shape: must have id field that is a non-empty string
    if (!isValidJWTPayload(decoded)) {
      throw new Error('Invalid token payload: id must be a non-empty string');
    }

    return {
      id: decoded.id,
      ...Object.fromEntries(
        Object.entries(decoded).filter(([key]) => key !== 'iat' && key !== 'exp')
      ),
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Generate a JWT token for testing or login.
 * Tokens expire in 24 hours.
 */
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
}
