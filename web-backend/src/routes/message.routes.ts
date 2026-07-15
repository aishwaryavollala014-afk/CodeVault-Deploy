import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();

// Everything here is caller-scoped → auth required on all routes.
router.use(requireAuth);

const sendLimiter = rateLimit({ windowSec: 60, max: 30, keyPrefix: 'msg-send' });

router.get('/', MessageController.listConversations);
// NOTE: must be registered BEFORE '/:handle' or Express matches it as a handle.
router.get('/unread-count', MessageController.unreadCount);
router.get('/:handle', MessageController.getConversation);
router.post('/:handle', sendLimiter, MessageController.send);

export default router;
