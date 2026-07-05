import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, NotificationController.list);
router.post('/read-all', requireAuth, NotificationController.markAllRead);

export default router;
