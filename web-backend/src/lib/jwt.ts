import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser, JwtClaims } from '../types';
import { UnauthenticatedError } from '../utils/errors';

/**
 * Access-token signing/verification. The claim shape (JwtClaims) is frozen and
 * shared with git-service, which verifies tokens with the same JWT_SECRET.
 * Refresh tokens are NOT JWTs — they're opaque random strings stored hashed
 * (see auth.service.ts), enabling rotation + reuse detection.
 */
export function signAccessToken(user: AuthUser): string {
  const payload: Omit<JwtClaims, 'iat' | 'exp'> = {
    sub: user.id,
    role: user.role,
    handle: user.handle,
    type: 'access',
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
}

export function verifyAccessToken(token: string): JwtClaims {
  let decoded: JwtClaims;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtClaims;
  } catch {
    throw new UnauthenticatedError('Invalid or expired token');
  }
  if (decoded.type !== 'access') {
    throw new UnauthenticatedError('Wrong token type');
  }
  return decoded;
}
