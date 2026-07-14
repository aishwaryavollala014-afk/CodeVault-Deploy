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
const basePrisma = new PrismaClient({
  log: isProd ? ['error'] : ['query', 'info', 'warn', 'error'],
});

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const userId = getRlsUserId();
        if (userId) {
          const safe = userId.replace(/'/g, "''");
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRawUnsafe(`SELECT set_config('app.current_user_id', '${safe}', true)`),
            query(args),
          ]);
          return result;
        }
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

export default prisma;

declare global {
  var prisma: undefined | PrismaClient;
}

if (!isProd) globalThis.prisma = prisma;
