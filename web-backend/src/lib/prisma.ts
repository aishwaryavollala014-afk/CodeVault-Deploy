import { PrismaClient } from '@prisma/client';
import { isDev } from '../config/env';

/**
 * Single shared Prisma client (connection pool). Every repository/service
 * imports this instance — never instantiate PrismaClient elsewhere.
 * In dev we reuse the client across hot-reloads to avoid exhausting connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
  });

if (isDev) globalForPrisma.prisma = prisma;
