import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { enqueueSync } from '../jobs/queue';
import { triggerSyncSchema, listQuerySchema } from '../validators/sync.validator';
import { NotFoundError, ExpiredSessionError } from '../utils/errors';

/** POST /sync — enqueue sync for one owned connection, or all sync-enabled ones. */
export async function trigger(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { connectionId } = triggerSyncSchema.parse(req.body ?? {});

  const connections = await prisma.connection.findMany({
    where: {
      userId, // ownership comes from the JWT, never the body
      deletedAt: null,
      syncEnabled: true,
      ...(connectionId ? { id: connectionId } : {}),
    },
    select: { id: true, tokenStatus: true },
  });

  if (connectionId && connections.length === 0) {
    throw new NotFoundError('Connection not found or not sync-enabled');
  }
  const expired = connections.find((c) => c.tokenStatus === 'expired');
  if (expired) throw new ExpiredSessionError();

  const jobIds = await Promise.all(
    connections.map((c) => enqueueSync({ userId, connectionId: c.id, trigger: 'manual' })),
  );

  res.status(202).json({ accepted: true, enqueued: jobIds.length, jobIds });
}

/** GET /sync/status — per-connection sync state for the dashboard. */
export async function status(req: Request, res: Response): Promise<void> {
  const rows = await prisma.connection.findMany({
    where: { userId: req.user!.id, deletedAt: null },
    select: {
      id: true,
      platform: true,
      username: true,
      tokenStatus: true,
      lastSyncedAt: true,
      solvedCount: true,
    },
  });
  res.status(200).json({
    items: rows.map((c) => ({
      connectionId: c.id,
      platform: c.platform,
      username: c.username,
      status: c.tokenStatus === 'expired' ? 'expired' : 'active',
      lastSyncedAt: c.lastSyncedAt ? c.lastSyncedAt.toISOString() : null,
      itemsSynced: c.solvedCount,
    })),
  });
}

/** GET /sync/activity — recent sync runs as an activity feed (cursor-paginated). */
export async function activity(req: Request, res: Response): Promise<void> {
  const { cursor, limit } = listQuerySchema.parse(req.query);
  const take = Math.min(limit ?? 20, 50);
  const runs = await prisma.syncRun.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = runs.length > take;
  const items = runs.slice(0, take);
  res.status(200).json({
    items: items.map((r) => ({
      id: r.id,
      type: r.status,
      message: `Sync ${r.status}: ${r.itemsPushed} pushed / ${r.itemsFetched} fetched`,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
