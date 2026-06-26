import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';
import type { PlatformName } from '../types';

export interface ProblemDetailDto {
  platform: PlatformName;
  number: string;
  title: string;
  difficulty: string | null;
  language: string | null;
  topics: string[];
  solvedAt: string | null;
  solutionPath: string | null;
  githubUrl: string | null;
  syncedToGit: boolean;
}

/** Problem detail (metadata + GitHub link). The code itself lives in GitHub. */
export async function getProblem(
  userId: string,
  platform: PlatformName,
  number: string,
): Promise<ProblemDetailDto> {
  const problem = await prisma.problem.findFirst({ where: { userId, platform, number } });
  if (!problem) throw new NotFoundError('Problem not found');

  const repo = await prisma.githubRepo.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  const githubUrl =
    repo && problem.solutionPath
      ? `https://github.com/${repo.repoFullName}/blob/${repo.defaultBranch}/${problem.solutionPath}`
      : null;

  return {
    platform: problem.platform,
    number: problem.number,
    title: problem.title,
    difficulty: problem.difficulty,
    language: problem.language,
    topics: problem.topics,
    solvedAt: problem.solvedAt ? problem.solvedAt.toISOString() : null,
    solutionPath: problem.solutionPath,
    githubUrl,
    syncedToGit: problem.syncedToGit,
  };
}
