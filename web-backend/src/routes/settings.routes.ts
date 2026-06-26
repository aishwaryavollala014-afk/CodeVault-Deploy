import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateSettingsSchema } from '../validators/settings.validator';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(settingsController.getSettings));
router.patch('/', validateBody(updateSettingsSchema), asyncHandler(settingsController.updateSettings));

export default router;
