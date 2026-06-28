import { Application } from 'express';
import { env } from './config/env';
import logger from './lib/logger';
import prisma from './lib/prisma';
import { redis } from './lib/redis';

export const startServer = async (app: Application) => {
  const port = parseInt(env.PORT, 10) || 4000;

  const server = app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
  });

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
