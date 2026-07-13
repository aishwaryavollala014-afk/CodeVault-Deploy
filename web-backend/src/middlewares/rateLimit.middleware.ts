import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import logger from './../lib/logger';

interface RateLimitOptions {
  windowSec: number;
  max: number;
  keyPrefix: string;
}

// Fixed-window rate limiter backed by Redis. Keyed by authenticated user when available,
// otherwise by client IP — so it protects the public auth endpoints (magic-link, OAuth
// exchange) from abuse/enumeration. Fails OPEN on Redis errors so a cache hiccup never
// locks out legitimate users.
export function rateLimit({ windowSec, max, keyPrefix }: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = (req as { user?: { userId?: string } }).user?.userId ?? req.ip ?? 'anon';
      const key = `rl:${keyPrefix}:${id}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);
      if (count > max) {
        res.setHeader('Retry-After', String(windowSec));
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
      }
      next();
    } catch (err) {
      logger.warn({ err }, 'rate limiter error; allowing request');
      next();
    }
  };
}
