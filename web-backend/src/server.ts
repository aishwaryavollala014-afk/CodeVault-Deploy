import { Application } from 'express';
import cron from 'node-cron';
import { env } from './config/env';
import logger from './lib/logger';
import prisma from './lib/prisma';
import { redis } from './lib/redis';
import { runRetentionJob } from './jobs/retention.job';

export const startServer = async (app: Application) => {
  const port = parseInt(env.PORT, 10) || 4000;

  const server = app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
  });

  // ── Data-retention cron: daily at 02:00 UTC ──────────────────────────────
  // Purges notifications >90d, stale sessions, audit logs >180d,
  // inactive-user stats snapshots, and GDPR hard-deletes (see jobs/retention.job.ts).
  cron.schedule('0 2 * * *', () => {
    runRetentionJob().catch((err) =>
      logger.error({ err }, '[RetentionJob] Unhandled error in retention job'),
    );
  }, { timezone: 'UTC' });
  logger.info('[RetentionJob] Scheduled daily at 02:00 UTC');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server gracefully...');
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
};
