import { Router } from 'express';
import { FollowController } from '../controllers/follow.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Mutations require auth + a modest rate limit (follow/unfollow spam guard).
const followLimiter = rateLimit({ windowSec: 60, max: 30, keyPrefix: 'follow' });

router.post('/:handle/follow', requireAuth, followLimiter, FollowController.follow);
router.delete('/:handle/follow', requireAuth, followLimiter, FollowController.unfollow);

// Follower/following lists are public (profiles are public).
router.get('/:handle/followers', FollowController.followers);
router.get('/:handle/following', FollowController.following);

export default router;
