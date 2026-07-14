import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env';
import { getRlsUserId } from './rls-context';
import logger from './logger';

/**
 * Prisma client with Row-Level Security (RLS) support.
 *
 * Uses Prisma's `$use` middleware to inject `SET app.current_user_id`
 * before every database operation when an authenticated user context exists.
 *
 * The GUC is set at the session level (`SET` without LOCAL) because Prisma
 * operations don't share a transaction scope with the middleware hook.
 * We reset it to empty string after the query to prevent leaking between
 * requests on the same pooled connection.
 */
const prisma = new PrismaClient({
  log: isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
});

prisma.$use(async (params, next) => {
  // Prevent infinite loop: our own $executeRawUnsafe calls go through this middleware
  if (params.action === 'executeRaw' || params.action === 'queryRaw') {
    return next(params);
  }

  const userId = getRlsUserId();

  if (userId) {
    // Sanitize: cuid() is alphanumeric, but defence-in-depth
    const safe = userId.replace(/'/g, "''");
    try {
      await prisma.$executeRawUnsafe(`SET app.current_user_id = '${safe}'`);
    } catch (err) {
      logger.warn({ err }, 'Failed to set RLS GUC');
    }
  }

  try {
    return await next(params);
  } finally {
    if (userId) {
      // Reset the GUC so the connection doesn't leak the userId to the next request
      try {
        await prisma.$executeRawUnsafe(`RESET app.current_user_id`);
      } catch {
        // best-effort reset
      }
    }
  }
});

export default prisma;

declare global {
  var prisma: undefined | PrismaClient;
}

if (!isProd) globalThis.prisma = prisma;
