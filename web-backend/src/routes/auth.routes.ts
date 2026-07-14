import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Magic-link send is the abuse-prone endpoint (it sends email) — throttle hardest.
const emailLimit = rateLimit({ windowSec: 900, max: 5, keyPrefix: 'auth-email' }); // 5 / 15 min / IP
const authLimit = rateLimit({ windowSec: 60, max: 20, keyPrefix: 'auth' }); // 20 / min / IP
const refreshLimit = rateLimit({ windowSec: 60, max: 30, keyPrefix: 'auth-refresh' }); // 30 / min / IP

router.post('/github', authLimit, AuthController.githubCallback);
router.post('/email', emailLimit, AuthController.requestEmailLogin);
router.post('/email/verify', authLimit, AuthController.verifyEmailLogin);
router.post('/refresh', refreshLimit, AuthController.refresh);
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;
