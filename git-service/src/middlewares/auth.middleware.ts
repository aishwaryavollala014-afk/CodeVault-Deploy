import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { UnauthenticatedError } from '../utils/errors';
import { withRlsContext } from '../lib/rls-context';
import logger from '../lib/logger';

// Verify the SAME user JWT web-backend issues (S1).
// 1. Prefer the HttpOnly access-token cookie (cv_access).
// 2. Fall back to Authorization: Bearer header (for the browser extension).
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  if (req.cookies?.cv_access) {
    token = req.cookies.cv_access;
  } else {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.slice('Bearer '.length);
    }
  }

  if (!token) {
    next(new UnauthenticatedError('Missing or invalid Authorization'));
    return;
  }

  try {
    req.user = verifyToken(token);
    // Run the rest of the request inside an RLS context so every Prisma
    // call automatically sets the PostgreSQL GUC for Row-Level Security.
    withRlsContext(req.user.userId, () => next());
  } catch (err) {
    logger.warn({ err, reqId: req.id }, 'Invalid or expired JWT');
    next(new UnauthenticatedError('Invalid or expired token'));
  }
}
