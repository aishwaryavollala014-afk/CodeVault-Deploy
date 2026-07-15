import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { withRlsContext } from '../lib/rls-context';
import logger from '../lib/logger';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Prefer the HttpOnly access-token cookie (set by auth controller).
  // 2. Fall back to Authorization: Bearer header (for the browser extension and API clients).
  let token: string | undefined;

  if (req.cookies?.cv_access) {
    token = req.cookies.cv_access;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    // Run the rest of the request inside an RLS context so every Prisma
    // call automatically sets the PostgreSQL GUC for Row-Level Security.
    withRlsContext(decoded.userId, () => next());
  } catch (err) {
    logger.warn({ err }, 'Invalid or expired JWT token');
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

/**
 * Like requireAuth but never rejects: attaches req.user + RLS context when a
 * valid token is present, and continues anonymously otherwise. Used by public
 * endpoints that personalise their response for signed-in viewers
 * (e.g. `isFollowing` on public profiles).
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (req.cookies?.cv_access) {
    token = req.cookies.cv_access;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    withRlsContext(decoded.userId, () => next());
  } catch {
    // Invalid/expired token on a public route → treat as anonymous.
    next();
  }
};

