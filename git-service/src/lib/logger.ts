import pino from 'pino';
import { env, isDev } from '../config/env';

/** Structured logger with secret redaction (mirrors web-backend). */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.token',
      '*.sessionToken',
      '*.tokenCipher',
      '*.code',
      '*.githubToken',
    ],
    censor: '[redacted]',
  },
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});
