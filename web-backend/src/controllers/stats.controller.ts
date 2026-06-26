import type { Request, Response } from 'express';
import * as statsService from '../services/stats.service';

/** GET /stats — unified dashboard analytics (Path A, auth + ownership-scoped). */
export async function getStats(req: Request, res: Response): Promise<void> {
  const stats = await statsService.getAggregatedStats(req.user!.id);
  res.status(200).json(stats);
}
