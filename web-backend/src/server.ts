import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

/**
 * Starts the HTTP server and wires graceful shutdown: on SIGINT/SIGTERM we
 * stop accepting new connections, finish in-flight requests, then close the
 * DB + Redis pools before exiting.
 */
export function startServer(): Server {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`web-backend listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        redis.disconnect();
      } finally {
        logger.info('shutdown complete');
        process.exit(0);
      }
    });
    // Hard-exit safety net if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}
