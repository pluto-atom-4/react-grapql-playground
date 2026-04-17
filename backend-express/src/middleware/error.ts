/**
 * Error Handling Middleware
 *
 * Global error handler for all Express routes.
 * Catches exceptions, logs errors, and returns JSON responses.
 */

import { Request, Response, NextFunction } from 'express'

export interface ErrorResponse {
  error: string
  message: string
  status: number
  details?: unknown
}

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Global error handler middleware
 * Must be registered LAST in middleware chain
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error (in production: use proper logger)
  console.error('[ERROR]', err)

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.name,
      message: err.message,
      status: err.status,
      ...(err.details && typeof err.details === 'object' ? { details: err.details } : {}),
    })
  }

  // Unknown error
  return res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    status: 500,
  })
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
