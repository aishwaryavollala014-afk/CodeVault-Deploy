import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// Publicly accessible; optionalAuth personalises the response (isFollowing)
// for signed-in viewers without requiring a token.
router.get('/:handle', optionalAuth, PublicController.getProfile);

export default router;
