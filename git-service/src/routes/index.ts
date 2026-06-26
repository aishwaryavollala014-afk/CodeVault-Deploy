import { Router } from 'express';
import healthRoutes from './health.routes';

/** API router — feature routers (sync, repos, problems) mount here under /api/v1. */
const router = Router();

// Added in the sync stage: /sync, /repos, /problems.

export default router;
export { healthRoutes };
