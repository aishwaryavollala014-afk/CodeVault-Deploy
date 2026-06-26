import type { Request, Response } from 'express';
import { z } from 'zod';
import * as publicService from '../services/public.service';

const paramsSchema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,30}$/),
});

/** GET /public/:username — no-auth, cached, rate-limited public profile. */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const { username } = paramsSchema.parse(req.params);
  const profile = await publicService.getPublicProfile(username);
  res.status(200).json(profile);
}
