import type { Request, Response, NextFunction } from 'express';
import { AppError, InternalError } from '../utils/errors';
import { logger } from '../lib/logger';
import { isProd } from '../config/env';
import type { ApiErrorBody } from '../types';

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId ?? 'unknown',
    },
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const appError = err instanceof AppError ? err : new InternalError();
  const requestId = req.requestId ?? 'unknown';

  if (appError.statusCode >= 500) logger.error({ err, requestId }, appError.message);
  else logger.warn({ code: appError.code, requestId }, appError.message);

  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message:
        appError.statusCode >= 500 && isProd ? 'Internal server error' : appError.message,
      requestId,
      ...(appError.details ? { details: appError.details } : {}),
    },
  };
  res.status(appError.statusCode).json(body);
}
