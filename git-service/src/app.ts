import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './lib/logger';
import { env } from './config/env';
import { requestId } from './middlewares/requestId.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import apiRoutes, { healthRoutes } from './routes';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as any).id }));

  // Health (unauthenticated, unprefixed).
  app.use('/', healthRoutes);

  // API.
  app.use('/api', apiRoutes);

  // 404 + error handler last.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
