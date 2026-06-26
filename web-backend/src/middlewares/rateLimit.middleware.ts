import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { RateLimitError } from '../utils/errors';

interface RateLimitOptions {
  windowSec: number;
  max: number;
  keyPrefix: string;
}

/**
 * Fixed-window rate limiter backed by Redis. Keyed by user id when
 * authenticated, otherwise by IP. Fails OPEN (allows the request) if Redis is
 * unavailable — availability over strictness for a non-critical control.
 */
export function rateLimit({ windowSec, max, keyPrefix }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void (async () => {
      const identity = req.user?.id ?? req.ip ?? 'unknown';
      const key = `rl:${keyPrefix}:${identity}`;
      try {
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, windowSec);
        const remaining = Math.max(0, max - count);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(remaining));
        if (count > max) throw new RateLimitError();
        next();
      } catch (err) {
        if (err instanceof RateLimitError) return next(err);
        logger.warn({ err }, 'rate-limit check failed — allowing request');
        next();
      }
    })();
  };
}
