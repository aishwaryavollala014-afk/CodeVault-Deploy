import type { Request, Response } from 'express';
import * as connectionService from '../services/connection.service';
import {
  createConnectionSchema,
  authorizeSyncSchema,
  connectionParamsSchema,
} from '../validators/platform.validator';

/** GET /platforms — list the caller's connections. */
export async function list(req: Request, res: Response): Promise<void> {
  const items = await connectionService.listConnections(req.user!.id);
  res.status(200).json({ items });
}

/** POST /platforms/connect — add a platform username (stats-only by default). */
export async function connect(req: Request, res: Response): Promise<void> {
  const input = createConnectionSchema.parse(req.body);
  const connection = await connectionService.createConnection(req.user!.id, input);
  res.status(201).json(connection);
}

/** POST /platforms/:id/authorize — store the encrypted sync token. */
export async function authorize(req: Request, res: Response): Promise<void> {
  const { id } = connectionParamsSchema.parse(req.params);
  const { sessionToken } = authorizeSyncSchema.parse(req.body);
  const connection = await connectionService.authorizeSync(req.user!.id, id, sessionToken);
  res.status(200).json(connection);
}

/** DELETE /platforms/:id — remove a connection (purges its token). */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = connectionParamsSchema.parse(req.params);
  await connectionService.removeConnection(req.user!.id, id);
  res.status(204).end();
}
