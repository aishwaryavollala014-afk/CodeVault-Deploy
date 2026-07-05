import { Request, Response } from 'express';
import { ConnectionService } from '../services/connection.service';
import { NotificationService } from '../services/notification.service';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';

const PLATFORM_LABELS: Record<string, string> = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  codechef: 'CodeChef',
  hackerrank: 'HackerRank',
};

export class PlatformController {
  static async addConnection(req: Request, res: Response): Promise<void> {
    try {
      const { platform, username, sessionToken } = req.body;
      const userId = req.user!.userId;

      if (!platform || !username || !Object.values(PlatformType).includes(platform)) {
        res.status(400).json({ error: 'Valid platform and username are required' });
        return;
      }

      const connection = await ConnectionService.addConnection(userId, platform as PlatformType, username, sessionToken);
      // Emit a real notification for this event (best-effort, never blocks the response).
      NotificationService.create(
        userId,
        'system',
        `${PLATFORM_LABELS[platform] || platform} connected`,
        `Your ${PLATFORM_LABELS[platform] || platform} profile @${username} is now linked.`,
      ).catch((e) => logger.warn({ e }, 'notification emit failed'));
      res.status(201).json(connection);
    } catch (error: any) {
      logger.error(error, 'Add connection error');
      res.status(409).json({ error: error.message });
    }
  }

  static async listConnections(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const connections = await ConnectionService.listConnections(userId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list connections' });
    }
  }

  static async removeConnection(req: Request, res: Response): Promise<void> {
    try {
      const { platform } = req.params;
      const userId = req.user!.userId;
      
      await ConnectionService.removeConnection(userId, platform as PlatformType);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove connection' });
    }
  }
}
