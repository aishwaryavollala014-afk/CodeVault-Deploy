import type { Request, Response } from 'express';
import * as repoService from '../services/githubRepo.service';
import {
  repoMappingParamsSchema,
  updateRepoMappingSchema,
} from '../validators/settings.validator';

/** GET /github/repos */
export async function list(req: Request, res: Response): Promise<void> {
  const items = await repoService.listRepoMappings(req.user!.id);
  res.status(200).json({ items });
}

/** PATCH /github/repos/:platform */
export async function update(req: Request, res: Response): Promise<void> {
  const { platform } = repoMappingParamsSchema.parse(req.params);
  const input = updateRepoMappingSchema.parse(req.body);
  const mapping = await repoService.upsertRepoMapping(req.user!.id, platform, input);
  res.status(200).json(mapping);
}
