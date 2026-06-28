import Redis from 'ioredis';
import { env } from '../config/env';
import logger from './logger';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error(err, 'Redis Client Error');
});

redis.on('connect', () => {
  logger.info('Redis Client Connected');
});
