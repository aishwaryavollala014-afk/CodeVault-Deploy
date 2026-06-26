import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { requestId } from './middlewares/requestId.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import apiRouter, { healthRoutes } from './routes';

/** Builds the git-service Express app (mirrors web-backend's middleware order). */
export function createApp(): Application {
  const app = express();
  app.disable('x-powered-by');

  app.use(requestId);
  app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: req.requestId }) }));
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/', healthRoutes);
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
