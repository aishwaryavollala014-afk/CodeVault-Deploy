import cron from 'node-cron';
import { env } from '../config/env';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { enqueueSync } from './queue';

// Register the cron job that periodically enqueues a sync for every active connection.
// It only ENQUEUES — the worker (sync.job.ts) does the actual work, so a crash mid-sync
// is retried from Redis rather than lost.
export function startScheduler(): void {
  if (!env.SYNC_ENABLED) {
    logger.warn('SYNC_ENABLED=false; scheduler not started (kill switch)');
    return;
  }
  if (!cron.validate(env.SYNC_CRON)) {
    logger.error({ cron: env.SYNC_CRON }, 'invalid SYNC_CRON; scheduler not started');
    return;
  }

  cron.schedule(env.SYNC_CRON, async () => {
    try {
      const connections = await prisma.connection.findMany({
        where: { syncEnabled: true, tokenStatus: 'active', deletedAt: null },
        select: { id: true },
      });
      logger.info({ count: connections.length }, 'scheduler tick: enqueueing active connections');
      for (const c of connections) {
        await enqueueSync({ connectionId: c.id, trigger: 'schedule' });
      }
    } catch (err) {
      logger.error(err, 'scheduler tick failed');
    }
  });

  logger.info({ cron: env.SYNC_CRON }, 'sync scheduler started');
}
