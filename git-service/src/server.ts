import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

/** Starts the HTTP API server with graceful shutdown. */
export function startServer(): Server {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`git-service listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down git-service`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        redis.disconnect();
      } finally {
        logger.info('shutdown complete');
        process.exit(0);
      }
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}
