import { Router } from 'express';
import { PublicController } from '../controllers/public.controller';

const router = Router();

// Publicly accessible, no auth required
router.get('/:handle', PublicController.getProfile);

export default router;
