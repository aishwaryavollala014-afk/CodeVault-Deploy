import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthenticatedError } from '../utils/errors';

export const ACCESS_COOKIE = 'cv_access';
export const REFRESH_COOKIE = 'cv_refresh';

/**
 * Protects a route: verifies the access JWT (from the httpOnly cookie or a
 * Bearer header) and attaches req.user. The user id is taken ONLY from the
 * verified token — never from the request body — which is what prevents BOLA.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  const header = req.header('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  const token = cookieToken ?? bearer;

  if (!token) throw new UnauthenticatedError();

  const claims = verifyAccessToken(token);
  req.user = { id: claims.sub, role: claims.role, handle: claims.handle };
  next();
}

/** Restricts a route to admins (vertical access control / BFLA). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') throw new UnauthenticatedError('Admin access required');
  next();
}
