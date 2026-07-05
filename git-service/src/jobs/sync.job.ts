import { Worker, type Job } from 'bullmq';
import { bullConnection, redis } from '../lib/redis';
import { env } from '../config/env';
import logger from '../lib/logger';
import prisma from '../lib/prisma';
import { runSync } from '../services/sync.service';
import { SYNC_QUEUE, type SyncJobData } from './queue';

const LOCK_TTL_MS = 30 * 60 * 1000; // 30-min safety lock per connection

// Start the BullMQ worker that processes sync jobs. Global concurrency = SYNC_CONCURRENCY;
// a Redis lock prevents a connection syncing twice at once; a Redis semaphore caps
// concurrent syncs per platform (SYNC_PLATFORM_CONCURRENCY) to respect rate limits.
export function startSyncWorker(): Worker<SyncJobData> {
  const worker = new Worker<SyncJobData>(
    SYNC_QUEUE,
    async (job: Job<SyncJobData>) => {
      if (!env.SYNC_ENABLED) {
        logger.warn('SYNC_ENABLED=false; skipping sync job');
        return;
      }

      const { connectionId, trigger } = job.data;
      const lockKey = `lock:sync:${connectionId}`;

      // Per-connection lock (SET NX PX).
      const locked = await redis.set(lockKey, job.id ?? '1', 'PX', LOCK_TTL_MS, 'NX');
      if (!locked) {
        logger.info({ connectionId }, 'sync already in progress for connection; skipping');
        return;
      }

      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
        select: { platform: true },
      });
      const platform = connection?.platform ?? 'unknown';
      const semaKey = `sema:platform:${platform}`;

      try {
        // Per-platform concurrency cap.
        const count = await redis.incr(semaKey);
        await redis.expire(semaKey, Math.ceil(LOCK_TTL_MS / 1000));
        if (count > env.SYNC_PLATFORM_CONCURRENCY) {
          await redis.decr(semaKey);
          // Throwing lets BullMQ retry this job later (backoff), once a slot frees.
          throw new Error(`platform ${platform} at concurrency cap; retrying later`);
        }

        try {
          const result = await runSync(connectionId, trigger);
          logger.info({ connectionId, platform, ...result }, 'sync complete');
          return result;
        } finally {
          await redis.decr(semaKey);
        }
      } finally {
        await redis.del(lockKey);
      }
    },
    {
      connection: bullConnection,
      concurrency: env.SYNC_CONCURRENCY,
      limiter: {
        max: env.SYNC_LIMIT_MAX,
        duration: env.SYNC_LIMIT_DURATION,
      },
    },
  );

  // Without an 'error' listener, a Redis/connection error would throw and crash the process.
  worker.on('error', (err) => {
    logger.error({ err: err.message }, 'sync worker error (e.g. Redis unavailable)');
  });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'sync job failed');
  });
  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'sync job completed');
  });

  logger.info({ concurrency: env.SYNC_CONCURRENCY }, 'sync worker started');
  return worker;
}
