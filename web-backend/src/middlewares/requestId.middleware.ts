import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Attaches a correlation id to every request (honouring an inbound
 * X-Request-Id if present) and echoes it back in the response header.
 * The id flows into logs + error envelopes for end-to-end tracing.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.length <= 200 ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
