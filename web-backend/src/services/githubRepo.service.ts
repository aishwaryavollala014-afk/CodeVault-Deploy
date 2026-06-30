import prisma from '../lib/prisma';
import { PlatformType, RepoVisibility, FolderConvention } from '@prisma/client';
import logger from '../lib/logger';

export class GithubRepoService {
  static async upsertRepoMapping(
    userId: string,
    platform: PlatformType,
    repoFullName: string,
    visibility: RepoVisibility = 'public',
    folderConvention: FolderConvention = 'number',
    defaultBranch: string = 'main'
  ) {
    try {
      const mapping = await prisma.githubRepo.upsert({
        where: {
          userId_platform: { userId, platform }
        },
        update: {
          repoFullName,
          visibility,
          folderConvention,
          defaultBranch,
        },
        create: {
          userId,
          platform,
          repoFullName,
          visibility,
          folderConvention,
          defaultBranch,
        }
      });
      return mapping;
    } catch (error: any) {
      logger.error({ err: error.message }, 'Failed to upsert repo mapping');
      throw error;
    }
  }
}
