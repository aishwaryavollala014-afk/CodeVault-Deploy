import { Router } from 'express';
import syncRoutes from './sync.routes';
import ingestRoutes from './ingest.routes';
import repoRoutes from './repo.routes';
import problemRoutes from './problem.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mounted under /api in app.ts.
router.use('/sync', syncRoutes);
router.use('/ingest', ingestRoutes);
router.use('/repos', repoRoutes);
router.use('/problems', problemRoutes);

export default router;
export { healthRoutes };
