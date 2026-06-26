import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Single shared Redis client (cache + rate-limit). Reused across hot-reloads
 * in dev. Connection errors are logged but never crash the process — stats
 * degrade gracefully when the cache is unavailable.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });

redis.on('error', (err) => logger.warn({ err }, 'redis connection error'));

if (env.NODE_ENV === 'development') globalForRedis.redis = redis;
