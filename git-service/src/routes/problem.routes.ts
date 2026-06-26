import { Router } from 'express';
import * as problemController from '../controllers/problem.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

router.get('/:platform/:number', asyncHandler(problemController.getProblem));

export default router;
