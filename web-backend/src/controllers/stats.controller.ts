import type { Request, Response } from 'express';
import { z } from 'zod';
import * as statsService from '../services/stats.service';

/** GET /stats — unified dashboard analytics (Path A, auth + ownership-scoped). */
export async function getStats(req: Request, res: Response): Promise<void> {
  const stats = await statsService.getAggregatedStats(req.user!.id);
  res.status(200).json(stats);
}

const recentQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/** GET /stats/recent — recent solved problems (cursor-paginated). */
export async function getRecent(req: Request, res: Response): Promise<void> {
  const { cursor, limit } = recentQuerySchema.parse(req.query);
  const page = await statsService.getRecentSubmissions(req.user!.id, { cursor, limit });
  res.status(200).json(page);
}
