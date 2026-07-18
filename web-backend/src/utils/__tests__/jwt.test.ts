import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken, verifyToken } from '../jwt';
import jwt from 'jsonwebtoken';

describe('jwt utils', () => {
  const payload = { userId: 'user-123' };

  it('should sign and verify a token successfully', () => {
    const token = signToken(payload, '1h');
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should throw an error for an invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow(jwt.JsonWebTokenError);
  });

  it('should respect expiration time', () => {
    const token = signToken(payload, '-1s'); // Expired immediately
    expect(() => verifyToken(token)).toThrow(jwt.TokenExpiredError);
  });
});
