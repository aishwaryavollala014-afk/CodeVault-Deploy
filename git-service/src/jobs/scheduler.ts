import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { enqueueSync } from './queue';

/**
 * Registers the periodic sync: on each cron tick, enqueue one job per active,
 * sync-enabled connection (workers consume them). Idempotency + per-connection
 * locks live in the sync service.
 */
export function startScheduler(): void {
  cron.schedule(env.SYNC_CRON, async () => {
    if (!env.SYNC_ENABLED) {
      logger.warn('SYNC_ENABLED=false — skipping scheduled sync (kill switch)');
      return;
    }
    const connections = await prisma.connection.findMany({
      where: { syncEnabled: true, tokenStatus: 'active', deletedAt: null },
      select: { id: true, userId: true },
    });
    await Promise.all(
      connections.map((c) =>
        enqueueSync({ userId: c.userId, connectionId: c.id, trigger: 'schedule' }),
      ),
    );
    logger.info({ count: connections.length }, 'scheduled sync enqueued');
  });
  logger.info({ cron: env.SYNC_CRON }, 'sync scheduler registered');
}
