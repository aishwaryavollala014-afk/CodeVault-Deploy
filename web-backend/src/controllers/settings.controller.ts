import type { Request, Response } from 'express';
import * as settingsService from '../services/settings.service';
import { updateSettingsSchema } from '../validators/settings.validator';

/** GET /settings */
export async function getSettings(req: Request, res: Response): Promise<void> {
  const settings = await settingsService.getSettings(req.user!.id);
  res.status(200).json(settings);
}

/** PATCH /settings */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  const patch = updateSettingsSchema.parse(req.body);
  const settings = await settingsService.updateSettings(req.user!.id, patch);
  res.status(200).json(settings);
}
