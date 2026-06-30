import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/github', AuthController.githubCallback);
router.post('/email', AuthController.requestEmailLogin);
router.post('/email/verify', AuthController.verifyEmailLogin);
router.get('/me', requireAuth, AuthController.me);

export default router;
