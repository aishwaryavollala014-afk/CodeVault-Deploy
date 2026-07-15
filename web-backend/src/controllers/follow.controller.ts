import { Request, Response } from 'express';
import { FollowService } from '../services/follow.service';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const SAFE_ERRORS: Record<string, number> = {
  'User not found': 404,
  'Cannot follow yourself': 400,
};

const respondError = (res: Response, error: any, log: string) => {
  const status = SAFE_ERRORS[error?.message];
  if (status) {
    res.status(status).json({ error: error.message });
    return;
  }
  logger.error(error, log);
  res.status(500).json({ error: 'Something went wrong' });
};

export class FollowController {
  // POST /api/users/:handle/follow
  static async follow(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { handle: true } });
      if (!me) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const result = await FollowService.follow(userId, me.handle, req.params.handle);
      res.json(result);
    } catch (error) {
      respondError(res, error, 'Follow error');
    }
  }

  // DELETE /api/users/:handle/follow
  static async unfollow(req: Request, res: Response): Promise<void> {
    try {
      const result = await FollowService.unfollow(req.user!.userId, req.params.handle);
      res.json(result);
    } catch (error) {
      respondError(res, error, 'Unfollow error');
    }
  }

  // GET /api/users/:handle/followers?cursor=
  static async followers(req: Request, res: Response): Promise<void> {
    try {
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      res.json(await FollowService.listFollowers(req.params.handle, cursor));
    } catch (error) {
      respondError(res, error, 'List followers error');
    }
  }

  // GET /api/users/:handle/following?cursor=
  static async following(req: Request, res: Response): Promise<void> {
    try {
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      res.json(await FollowService.listFollowing(req.params.handle, cursor));
    } catch (error) {
      respondError(res, error, 'List following error');
    }
  }
}
