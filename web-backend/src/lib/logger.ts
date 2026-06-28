import pino from 'pino';
import { env, isDev } from '../config/env';

const logger = pino({
  level: env.LOG_LEVEL,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
});

export default logger;
