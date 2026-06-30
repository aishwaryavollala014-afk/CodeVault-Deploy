import { Router } from 'express';
import * as syncController from '../controllers/sync.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../utils/helpers';
import { triggerSyncSchema } from '../validators/sync.validator';

const router = Router();

// All sync routes require the user's JWT.
router.use(requireAuth);

// Per-user cooldown on manual triggers to protect platform/GitHub rate limits.
const triggerLimit = rateLimit({ windowSec: 60, max: 10, keyPrefix: 'sync-trigger' });

router.post('/', triggerLimit, validateBody(triggerSyncSchema), asyncHandler(syncController.trigger));
router.get('/status', asyncHandler(syncController.status));
router.get('/activity', asyncHandler(syncController.activity));

export default router;
