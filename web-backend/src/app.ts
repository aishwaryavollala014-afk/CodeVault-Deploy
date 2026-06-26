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

/**
 * Builds the Express application. Middleware order matters:
 * requestId → logging → security headers → CORS → body parsing → routes → errors.
 */
export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestId);
  app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: req.requestId }) }));
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Infra probes (outside /api so load balancers can hit them directly).
  app.use('/', healthRoutes);

  // Versioned API surface.
  app.use('/api/v1', apiRouter);

  // 404 + central error handler (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
