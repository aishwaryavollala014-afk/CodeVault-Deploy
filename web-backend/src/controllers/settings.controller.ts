import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import logger from '../lib/logger';

export class SettingsController {
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const settings = await SettingsService.getSettings(req.user.userId);
      res.json(settings);
    } catch (err: any) {
      logger.error({ err }, 'Failed to get settings');
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const payload = req.body;
      const updatedSettings = await SettingsService.updateSettings(req.user.userId, payload);
      res.json(updatedSettings);
    } catch (err: any) {
      logger.error({ err }, 'Failed to update settings');
      const status = err.message === 'Handle is already taken' || err.message.includes('Handle can only') ? 400 : 500;
      res.status(status).json({ error: err.message || 'Internal server error' });
    }
  }
}
