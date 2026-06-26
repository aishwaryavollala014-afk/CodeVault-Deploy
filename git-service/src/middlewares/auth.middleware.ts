import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthenticatedError } from '../utils/errors';
import type { JwtClaims } from '../types';

const ACCESS_COOKIE = 'cv_access';

/**
 * Zero-trust boundary: git-service verifies the SAME user JWT that web-backend
 * issues (shared JWT_SECRET) — never a static internal key from the browser
 * (SECURITY_PLAN S1). The user id comes only from the verified token; every
 * sync/read is then re-checked for ownership downstream.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  const header = req.header('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  const token = cookieToken ?? bearer;
  if (!token) throw new UnauthenticatedError();

  let claims: JwtClaims;
  try {
    claims = jwt.verify(token, env.JWT_SECRET) as JwtClaims;
  } catch {
    throw new UnauthenticatedError('Invalid or expired token');
  }
  if (claims.type !== 'access') throw new UnauthenticatedError('Wrong token type');

  req.user = { id: claims.sub, role: claims.role, handle: claims.handle };
  next();
}
