import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import logger from '../lib/logger';

export class NotificationController {
  // GET /api/notifications — recent notifications + unread count for the caller.
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const [items, unread] = await Promise.all([
        NotificationService.list(userId),
        NotificationService.unreadCount(userId),
      ]);
      res.json({ items, unread });
    } catch (error) {
      logger.error(error, 'List notifications error');
      res.status(500).json({ error: 'Failed to load notifications' });
    }
  }

  // POST /api/notifications/read-all — mark all as read.
  static async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      await NotificationService.markAllRead(req.user!.userId);
      res.status(204).send();
    } catch (error) {
      logger.error(error, 'Mark notifications read error');
      res.status(500).json({ error: 'Failed to update notifications' });
    }
  }
}
