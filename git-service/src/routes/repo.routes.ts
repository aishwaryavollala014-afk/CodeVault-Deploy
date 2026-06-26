import { Router } from 'express';
import * as repoController from '../controllers/repo.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(repoController.list));
router.get('/:platform/files', asyncHandler(repoController.files));
router.get('/:platform/commits', asyncHandler(repoController.commits));

export default router;
