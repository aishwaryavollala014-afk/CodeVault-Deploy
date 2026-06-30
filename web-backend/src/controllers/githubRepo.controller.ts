import { Request, Response } from 'express';
import { GithubRepoService } from '../services/githubRepo.service';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';

export class GithubRepoController {
  static async setupRepo(req: Request, res: Response): Promise<void> {
    try {
      const { platform, repoFullName, visibility, folderConvention, defaultBranch } = req.body;
      const userId = req.user!.userId;

      if (!platform || !repoFullName || !Object.values(PlatformType).includes(platform)) {
        res.status(400).json({ error: 'Valid platform and repoFullName are required' });
        return;
      }

      const mapping = await GithubRepoService.upsertRepoMapping(
        userId,
        platform as PlatformType,
        repoFullName,
        visibility,
        folderConvention,
        defaultBranch
      );

      res.status(200).json(mapping);
    } catch (error: any) {
      logger.error(error, 'Setup repo mapping error');
      res.status(500).json({ error: 'Failed to configure repository' });
    }
  }
}
