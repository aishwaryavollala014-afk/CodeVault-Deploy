import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Shared Redis connection (locks + BullMQ). BullMQ requires
 * maxRetriesPerRequest = null on its connection.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

redis.on('error', (err) => logger.warn({ err }, 'redis connection error'));

if (env.NODE_ENV === 'development') globalForRedis.redis = redis;
