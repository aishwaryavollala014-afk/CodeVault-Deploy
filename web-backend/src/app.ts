import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import logger from './lib/logger';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import platformRoutes from './routes/platform.routes';
import statsRoutes from './routes/stats.routes';
import publicRoutes from './routes/public.routes';

export const createApp = (): Application => {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(cors({
    origin: env.NODE_ENV === 'production' ? 'https://codevault.io' : 'http://localhost:3000',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json());

  // Logging
  app.use(pinoHttp({ logger }));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/platforms', platformRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/public', publicRoutes);

  // Basic Error Handler (will be expanded later)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
      }
    });
  });

  return app;
};
