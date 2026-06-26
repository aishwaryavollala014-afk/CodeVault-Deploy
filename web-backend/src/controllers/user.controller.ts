import type { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { updateUserSchema } from '../validators/user.validator';

/** GET /users/me */
export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await userService.getMe(req.user!.id);
  res.status(200).json(user);
}

/** PATCH /users/me */
export async function updateMe(req: Request, res: Response): Promise<void> {
  const input = updateUserSchema.parse(req.body);
  const user = await userService.updateMe(req.user!.id, input);
  res.status(200).json(user);
}

/** DELETE /users/me */
export async function deleteMe(req: Request, res: Response): Promise<void> {
  await userService.deleteMe(req.user!.id);
  res.status(204).end();
}
