import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

/**
 * API router — mounts every feature router under /api/v1.
 * Health/readiness live at the root (outside /api) for infra probes.
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
// More feature routers land here (platforms, stats, public, settings, notifications...).

export default router;
export { healthRoutes };
