import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { decrypt } from '../lib/crypto';
import { verifyRepoAccess, pushFiles } from './github/github.service';
import { generateReadme } from './github/readme.generator';
import { questionPath, solutionPath, type FolderConvention } from './repo.service';
import { padNumber } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';
import type { GithubFile, RepoFileEntry } from '../types/github.types';
import type { PlatformName } from '../types';
import type { SolutionToSync } from '../types/sync.types';
import type { CapturedSubmissionInput } from '../validators/ingest.validator';

export interface IngestResult {
  accepted: number;
  pushed: number;
  skipped: number;
}

function toSolution(c: CapturedSubmissionInput): SolutionToSync {
  return {
    platform: c.platform,
    number: c.number,
    slug: c.slug,
    title: c.title,
    difficulty: c.difficulty,
    topics: c.topics,
    language: c.language,
    code: c.code,
    questionMarkdown: c.questionMarkdown,
    solvedAt: c.solvedAt,
    url: c.url,
  };
}

// Path B v2: the extension already captured code + question client-side, so unlike sync
// there's no platform-token fetch. We just resolve the GitHub repo + token, diff, push,
// regenerate the index, and persist. Reuses the same GitHub pipeline as sync.service.
export async function runIngest(
  userId: string,
  captures: CapturedSubmissionInput[],
): Promise<IngestResult> {
  const accepted = captures.length;
  let pushed = 0;
  let skipped = 0;

  const identity = await prisma.oAuthIdentity.findFirst({ where: { userId } });
  if (!identity) throw new NotFoundError('No GitHub identity for user');
  const githubToken = decrypt(identity.accessTokenCipher, identity.tokenIv);

  const byPlatform = new Map<PlatformName, CapturedSubmissionInput[]>();
  for (const c of captures) {
    const arr = byPlatform.get(c.platform) ?? [];
    arr.push(c);
    byPlatform.set(c.platform, arr);
  }

  for (const [platform, items] of byPlatform) {
    const connection = await prisma.connection.findUnique({
      where: { userId_platform: { userId, platform } },
    });
    const repo = await prisma.githubRepo.findUnique({
      where: { userId_platform: { userId, platform } },
    });
    if (!connection || !repo) {
      skipped += items.length;
      logger.warn(
        { platform, hasConnection: !!connection, hasRepo: !!repo },
        'ingest skipped — missing connection or repo mapping',
      );
      continue;
    }

    const run = await prisma.syncRun.create({
      data: { userId, connectionId: connection.id, status: 'running', trigger: 'manual', startedAt: new Date() },
    });

    try {
      const existing = await prisma.problem.findMany({
        where: { connectionId: connection.id, syncedToGit: true },
        select: { slug: true },
      });
      const synced = new Set(existing.map((e) => e.slug));
      const fresh = items.filter((i) => !synced.has(i.slug)).map(toSolution);

      if (fresh.length === 0) {
        await prisma.syncRun.update({
          where: { id: run.id },
          data: { status: 'success', itemsFetched: items.length, itemsPushed: 0, finishedAt: new Date() },
        });
        skipped += items.length;
        continue;
      }

      await verifyRepoAccess(githubToken, repo.repoFullName);

      const convention = repo.folderConvention as FolderConvention;
      const files: GithubFile[] = [];
      for (const item of fresh) {
        files.push({
          path: questionPath(item, convention),
          content: item.questionMarkdown || `# ${item.number}. ${item.title}\n`,
        });
        files.push({ path: solutionPath(item, convention), content: item.code });
      }

      // Regenerate the index README from existing + new problems.
      const all = await prisma.problem.findMany({ where: { userId, platform } });
      const entries = new Map<string, RepoFileEntry>();
      for (const p of all) {
        entries.set(p.slug, {
          number: p.number,
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty ?? undefined,
          language: p.language ?? 'txt',
          solutionPath: p.solutionPath ?? `${padNumber(p.number)}/solution.txt`,
          solvedAt: p.solvedAt?.toISOString().slice(0, 10),
        });
      }
      for (const item of fresh) {
        entries.set(item.slug, {
          number: item.number,
          slug: item.slug,
          title: item.title,
          difficulty: item.difficulty,
          language: item.language,
          solutionPath: solutionPath(item, convention),
          url: item.url,
          solvedAt: item.solvedAt?.toISOString().slice(0, 10),
        });
      }
      const repoName = repo.repoFullName.split('/')[1] ?? repo.repoFullName;
      files.push({ path: 'README.md', content: generateReadme(repoName, [...entries.values()]) });

      await pushFiles(
        githubToken,
        repo.repoFullName,
        repo.defaultBranch,
        files,
        `CodeVault (extension): ${fresh.length} problem(s) from ${platform}`,
      );

      for (const item of fresh) {
        await prisma.problem.upsert({
          where: { userId_platform_slug: { userId, platform, slug: item.slug } },
          create: {
            userId,
            connectionId: connection.id,
            platform,
            number: item.number,
            slug: item.slug,
            title: item.title,
            difficulty: item.difficulty,
            topics: item.topics,
            language: item.language,
            solutionPath: solutionPath(item, convention),
            solvedAt: item.solvedAt,
            syncedToGit: true,
            syncedAt: new Date(),
          },
          update: {
            title: item.title,
            difficulty: item.difficulty,
            topics: item.topics,
            language: item.language,
            solutionPath: solutionPath(item, convention),
            syncedToGit: true,
            syncedAt: new Date(),
          },
        });
      }

      await prisma.githubRepo.update({
        where: { id: repo.id },
        data: { lastSyncAt: new Date(), fileCount: { increment: fresh.length } },
      });
      await prisma.connection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date() },
      });
      await prisma.syncRun.update({
        where: { id: run.id },
        data: { status: 'success', itemsFetched: items.length, itemsPushed: fresh.length, finishedAt: new Date() },
      });
      await prisma.notification
        .create({
          data: {
            userId,
            type: 'sync',
            title: `Captured ${fresh.length} problem(s) from ${platform}`,
            body: `Pushed to ${repo.repoFullName} via the browser extension.`,
          },
        })
        .catch(() => undefined);

      pushed += fresh.length;
      skipped += items.length - fresh.length;
    } catch (err) {
      await prisma.syncRun
        .update({ where: { id: run.id }, data: { status: 'failed', errorCode: 'INGEST_FAILED', finishedAt: new Date() } })
        .catch(() => undefined);
      throw err;
    }
  }

  return { accepted, pushed, skipped };
}
