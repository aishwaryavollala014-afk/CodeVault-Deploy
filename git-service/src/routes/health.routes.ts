import { Router } from 'express';
import { getHealth, getReadiness } from '../controllers/health.controller';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.get('/health', getHealth);
router.get('/ready', asyncHandler(getReadiness));

export default router;
