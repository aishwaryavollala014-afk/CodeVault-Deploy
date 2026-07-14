import { Request, Response } from 'express';
import { PublicService } from '../services/public.service';
import logger from '../lib/logger';

export class PublicController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { handle } = req.params;
      const profile = await PublicService.getPublicProfile(handle);
      res.json(profile);
    } catch (error: any) {
      const safeMessages: Record<string, string> = {
        'User not found': 'User not found',
        'This profile is private': 'This profile is private',
      };
      const msg = safeMessages[error.message];
      if (msg) {
        res.status(404).json({ error: msg });
        return;
      }
      logger.error(error, 'Error fetching public profile');
      res.status(500).json({ error: 'Failed to load profile' });
    }
  }
}
