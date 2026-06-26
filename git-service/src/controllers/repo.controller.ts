import type { Request, Response } from 'express';
import * as repoService from '../services/repo.service';
import { platformParamsSchema, listQuerySchema } from '../validators/sync.validator';

/** GET /repos */
export async function list(req: Request, res: Response): Promise<void> {
  const items = await repoService.listRepos(req.user!.id);
  res.status(200).json({ items });
}

/** GET /repos/:platform/files */
export async function files(req: Request, res: Response): Promise<void> {
  const { platform } = platformParamsSchema.parse(req.params);
  const { cursor, limit } = listQuerySchema.parse(req.query);
  const page = await repoService.listFiles(req.user!.id, platform, { cursor, limit });
  res.status(200).json(page);
}

/** GET /repos/:platform/commits */
export async function commits(req: Request, res: Response): Promise<void> {
  const { platform } = platformParamsSchema.parse(req.params);
  const items = await repoService.listCommits(req.user!.id, platform);
  res.status(200).json({ items });
}
