import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Double Submit Cookie CSRF Middleware.
 * 
 * 1. Generates a cryptographically secure CSRF token if one doesn't exist.
 * 2. Sets the token in a `csrf-token` cookie (accessible by the frontend).
 * 3. On state-mutating requests (POST, PUT, PATCH, DELETE), verifies that the 
 *    `X-CSRF-Token` header exactly matches the cookie value.
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Ensure the client has a CSRF token
  let token = req.cookies['csrf-token'];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    // Not HttpOnly so frontend JS can read it to attach to the header
    res.cookie('csrf-token', token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict' depending on cross-origin needs
      path: '/',
    });
  }

  // 2. Validate token on mutating requests
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutatingMethods.includes(req.method)) {
    const headerToken = req.headers['x-csrf-token'];
    if (!headerToken || headerToken !== token) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid or missing CSRF token',
        }
      });
    }
  }

  next();
}
