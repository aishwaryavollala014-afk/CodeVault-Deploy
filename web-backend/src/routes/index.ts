import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import platformRoutes from './platform.routes';
import statsRoutes from './stats.routes';
import publicRoutes from './public.routes';
import settingsRoutes from './settings.routes';
import githubRepoRoutes from './githubRepo.routes';
import notificationRoutes from './notification.routes';

/**
 * API router — mounts every feature router under /api/v1.
 * Health/readiness live at the root (outside /api) for infra probes.
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/platforms', platformRoutes);
router.use('/stats', statsRoutes);
router.use('/public', publicRoutes);
router.use('/settings', settingsRoutes);
router.use('/github', githubRepoRoutes);
router.use('/notifications', notificationRoutes);

export default router;
export { healthRoutes };
