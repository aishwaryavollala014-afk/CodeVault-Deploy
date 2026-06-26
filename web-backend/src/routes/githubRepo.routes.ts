import { Router } from 'express';
import * as repoController from '../controllers/githubRepo.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateRepoMappingSchema } from '../validators/settings.validator';
import { asyncHandler } from '../utils/helpers';

const router = Router();

router.use(requireAuth);

router.get('/repos', asyncHandler(repoController.list));
router.patch('/repos/:platform', validateBody(updateRepoMappingSchema), asyncHandler(repoController.update));

export default router;
