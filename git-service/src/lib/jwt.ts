import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Mirrors web-backend/src/utils/jwt.ts — same JWT_SECRET, same payload shape.
// git-service only VERIFIES the user's access token (S1); web-backend signs it.
export interface JwtPayload {
  userId: string;
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
