import { Router } from 'express';
import * as repoController from '../controllers/repo.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// All repo routes require the user's JWT.
router.use(requireAuth);

router.get('/', asyncHandler(repoController.list));

export default router;
