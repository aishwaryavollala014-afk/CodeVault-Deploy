import { Router } from 'express';
import * as problemController from '../controllers/problem.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// All problem routes require the user's JWT.
router.use(requireAuth);

router.get('/', asyncHandler(problemController.list));

export default router;
