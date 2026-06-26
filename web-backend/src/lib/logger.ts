import pino from 'pino';
import { env, isDev } from '../config/env';

/**
 * Structured JSON logger (pino). In dev it pretty-prints; in prod it emits
 * JSON for the log sink. Sensitive fields are redacted so tokens/cookies/PII
 * never reach the logs (SECURITY_PLAN §12, OBSERVABILITY_PLAN §1).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.sessionToken',
      '*.accessToken',
      '*.refreshToken',
      '*.tokenCipher',
      '*.code',
    ],
    censor: '[redacted]',
  },
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});
