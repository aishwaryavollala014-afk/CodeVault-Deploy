import { prisma } from '../lib/prisma';
import type { PlatformName, RepoMappingDto } from '../types';
import type { UpdateRepoMappingInput } from '../validators/settings.validator';

function toDto(r: {
  platform: PlatformName;
  repoFullName: string;
  visibility: 'public' | 'private';
  folderConvention: 'number' | 'difficulty' | 'topic';
  defaultBranch: string;
  fileCount: number;
  lastSyncAt: Date | null;
}): RepoMappingDto {
  return {
    platform: r.platform,
    repoFullName: r.repoFullName,
    visibility: r.visibility,
    folderConvention: r.folderConvention,
    defaultBranch: r.defaultBranch,
    fileCount: r.fileCount,
    lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null,
  };
}

export async function listRepoMappings(userId: string): Promise<RepoMappingDto[]> {
  const rows = await prisma.githubRepo.findMany({ where: { userId }, orderBy: { platform: 'asc' } });
  return rows.map(toDto);
}

/** Create or update the GitHub repo a platform's solutions sync into. */
export async function upsertRepoMapping(
  userId: string,
  platform: PlatformName,
  input: UpdateRepoMappingInput,
): Promise<RepoMappingDto> {
  const row = await prisma.githubRepo.upsert({
    where: { userId_platform: { userId, platform } },
    create: {
      userId,
      platform,
      repoFullName: input.repoFullName,
      visibility: input.visibility ?? 'public',
      folderConvention: input.folderConvention ?? 'number',
      defaultBranch: input.defaultBranch ?? 'main',
    },
    update: {
      repoFullName: input.repoFullName,
      visibility: input.visibility,
      folderConvention: input.folderConvention,
      defaultBranch: input.defaultBranch,
    },
  });
  return toDto(row);
}
