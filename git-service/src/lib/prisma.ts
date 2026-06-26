import { PrismaClient } from '@prisma/client';
import { isDev } from '../config/env';

/**
 * Shared Prisma client over the SAME database as web-backend. git-service only
 * writes `problems` + `sync_runs` (and appends notifications); everything else
 * is read-only by convention (enforced by DB roles in prod).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: isDev ? ['warn', 'error'] : ['error'] });

if (isDev) globalForPrisma.prisma = prisma;
