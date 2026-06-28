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
      if (error.message === 'User not found' || error.message === 'This profile is private') {
        res.status(404).json({ error: error.message });
        return;
      }
      logger.error(error, 'Error fetching public profile');
      res.status(500).json({ error: 'Failed to load profile' });
    }
  }
}
