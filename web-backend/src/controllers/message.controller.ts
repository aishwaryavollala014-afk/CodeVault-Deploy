import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const SAFE_ERRORS: Record<string, number> = {
  'User not found': 404,
  'Cannot message yourself': 400,
  'Message cannot be empty': 400,
  'Message too long': 400,
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

const myHandle = async (userId: string): Promise<string | null> => {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { handle: true } });
  return me?.handle ?? null;
};

export class MessageController {
  // GET /api/messages — recent conversations for the caller.
  static async listConversations(req: Request, res: Response): Promise<void> {
    try {
      res.json(await MessageService.listConversations(req.user!.userId));
    } catch (error) {
      respondError(res, error, 'List conversations error');
    }
  }

  // GET /api/messages/unread-count — total unread (sidebar badge).
  static async unreadCount(req: Request, res: Response): Promise<void> {
    try {
      res.json(await MessageService.unreadCount(req.user!.userId));
    } catch (error) {
      respondError(res, error, 'Unread count error');
    }
  }

  // GET /api/messages/:handle — chat history (marks incoming as read).
  static async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const handle = await myHandle(userId);
      if (!handle) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      res.json(await MessageService.getConversation(userId, handle, req.params.handle, cursor));
    } catch (error) {
      respondError(res, error, 'Get conversation error');
    }
  }

  // POST /api/messages/:handle — send a message. Sender comes from the JWT only.
  static async send(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const handle = await myHandle(userId);
      if (!handle) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const result = await MessageService.send(userId, handle, req.params.handle, req.body?.content);
      res.status(201).json(result);
    } catch (error) {
      respondError(res, error, 'Send message error');
    }
  }
}
