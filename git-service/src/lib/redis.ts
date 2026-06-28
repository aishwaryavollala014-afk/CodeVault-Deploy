import Redis from 'ioredis';
import { env } from '../config/env';
import logger from './logger';

// Shared client for caching + per-connection sync locks.
export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error(err, 'Redis Client Error');
});

redis.on('connect', () => {
  logger.info('Redis Client Connected');
});

// BullMQ requires its own connection options (maxRetriesPerRequest must be null).
export const bullConnection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null as null,
};
