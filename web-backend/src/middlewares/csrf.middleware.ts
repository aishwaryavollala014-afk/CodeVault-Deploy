import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Double Submit Cookie CSRF Middleware.
 * 
 * 1. Generates a cryptographically secure CSRF token if one doesn't exist.
 * 2. Sets the token in a `csrf-token` cookie (accessible by the frontend).
 * 3. On state-mutating requests (POST, PUT, PATCH, DELETE), verifies that the
 *    `X-CSRF-Token` header exactly matches the cookie value.
 *
 * Pre-authentication routes are EXEMPT: the client cannot have a CSRF token on
 * its very first request (login), and OAuth login is already CSRF-protected by
 * the `state` parameter. Enforcing double-submit there would make login
 * impossible (403). These routes still receive the token cookie for later use.
 */
const CSRF_EXEMPT_PREFIXES = ['/api/auth', '/api/health'];

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

  // 2. Validate token on mutating requests (except pre-auth/exempt routes)
  const isExempt = CSRF_EXEMPT_PREFIXES.some((p) => req.path.startsWith(p));
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!isExempt && mutatingMethods.includes(req.method)) {
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
