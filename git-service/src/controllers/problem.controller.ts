import type { Request, Response } from 'express';
import { PlatformType } from '@prisma/client';
import prisma from '../lib/prisma';

// GET /api/problems — the caller's synced problems, newest first.
// Query: ?platform=leetcode  ?limit=50 (max 100)  ?cursor=<id> (keyset pagination)
export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const platformParam = typeof req.query.platform === 'string' ? req.query.platform : undefined;
  const platform =
    platformParam && (Object.values(PlatformType) as string[]).includes(platformParam)
      ? (platformParam as PlatformType)
      : undefined;

  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  const rows = await prisma.problem.findMany({
    where: { userId, ...(platform ? { platform } : {}) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      platform: true,
      number: true,
      slug: true,
      title: true,
      difficulty: true,
      language: true,
      solutionPath: true,
      solvedAt: true,
      syncedToGit: true,
      syncedAt: true,
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  res.json({ items, nextCursor: hasMore ? items[items.length - 1].id : null });
}
