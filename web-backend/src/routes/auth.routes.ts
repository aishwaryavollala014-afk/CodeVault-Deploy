import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// Throttle auth flows per IP (anti credential-stuffing / abuse / state-flooding).
const authLimit = rateLimit({ windowSec: 300, max: 20, keyPrefix: 'auth' });

router.get('/github/start', authLimit, asyncHandler(authController.startGithub));
router.get('/github/callback', authLimit, asyncHandler(authController.githubCallback));
router.get('/session', requireAuth, asyncHandler(authController.session));
router.post('/refresh', authLimit, asyncHandler(authController.refresh));
router.post('/logout', requireAuth, asyncHandler(authController.logout));

export default router;
