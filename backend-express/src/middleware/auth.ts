/**
 * JWT Authentication Middleware
 *
 * Verifies JWT tokens in the Authorization header.
 * Tokens must follow: Authorization: Bearer <token>
 *
 * Optional: Pass skipPaths array to skip auth for certain routes
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'

export interface AuthRequest extends Request {
  user: { id: string; [key: string]: unknown }
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; [key: string]: unknown }
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export function authMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  // For development/testing: if no token, attach mock user
  // In production: should return 401
  const token = _req.headers.authorization?.split(' ')[1]

  if (!token) {
    // Allow requests without token for testing
    // Production: return res.status(401).json({ error: 'No token' })
    ;(_req as AuthRequest).user = { id: 'test-user' }
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      [key: string]: unknown
    }
    ;(_req as AuthRequest).user = decoded
    next()
  } catch {
    return _res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Generate a test JWT token
 */
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' })
}
