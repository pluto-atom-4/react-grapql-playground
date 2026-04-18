import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate event bus requests from GraphQL backend
 * 
 * All requests to POST /events/emit must include a valid Authorization header
 * with the shared event secret. This prevents event injection attacks where
 * malicious actors could send fake build status updates, test results, etc.
 * 
 * Manufacturing Impact (Boltline):
 * - Fake "Build Failed" → Unnecessary rework, production stoppage
 * - Fake "Test Passed" → Ship defective hardware to customer  
 * - Fake "Status Update" → Wrong operational decisions by technicians
 * 
 * Pattern: Shared-Secret Authentication
 * - GraphQL backend sends: Authorization: Bearer ${EXPRESS_EVENT_SECRET}
 * - Express validates secret before broadcasting events
 * - Environment-injected secret (never hardcoded)
 * - Production upgrade: mTLS or API Gateway authentication
 */
export function validateEventSecret(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.EXPRESS_EVENT_SECRET}`;

  // Missing or invalid Authorization header
  if (!authHeader || authHeader !== expectedSecret) {
    console.warn('[SECURITY] Event authentication failed', {
      timestamp: new Date().toISOString(),
      event: req.body?.event,
      ip: req.ip,
      hasAuthHeader: !!authHeader
    });

    res.status(403).json({
      error: 'Forbidden: Invalid event secret',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // ✅ Request authenticated - log and proceed
  console.warn('[SECURITY] Event authenticated', {
    timestamp: new Date().toISOString(),
    event: req.body?.event,
    ip: req.ip
  });

  next();
}
