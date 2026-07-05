import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { decrypt } from '../lib/crypto';
import { getSubmissionAdapter } from './submissions';
import { verifyRepoAccess, pushFiles } from './github/github.service';
import { generateReadme } from './github/readme.generator';
import { toSolutionToSync } from './problem.service';
import { questionPath, solutionPath, type FolderConvention } from './repo.service';
import { padNumber } from '../utils/helpers';
import { ExpiredSessionError, NotFoundError, AppError } from '../utils/errors';
import type { GithubFile, RepoFileEntry } from '../types/github.types';
import type { SolutionToSync, SyncResult } from '../types/sync.types';
import type { PlatformName } from '../types';

type Trigger = 'schedule' | 'manual';

// Orchestrate Path B for one connection: fetch accepted code -> push to GitHub -> update DB.
// (Per-connection locking + concurrency caps are added in Phase 4.)
export async function runSync(connectionId: string, trigger: Trigger = 'manual'): Promise<SyncResult> {
  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    include: { secret: true, user: { include: { oauthIdentities: true } } },
  });
  if (!connection) throw new NotFoundError(`Connection ${connectionId} not found`);

  const run = await prisma.syncRun.create({
    data: {
      userId: connection.userId,
      connectionId,
      status: 'running',
      trigger,
      startedAt: new Date(),
    },
  });

  try {
    if (!connection.syncEnabled || !connection.secret) {
      await finishRun(run.id, 'skipped', 0, 0);
      return { itemsFetched: 0, itemsPushed: 0, skipped: 0 };
    }

    const adapter = getSubmissionAdapter(connection.platform as PlatformName);
    if (!adapter.supportsCodeSync) {
      logger.info({ platform: connection.platform }, 'Platform does not support code-sync; skipping.');
      await finishRun(run.id, 'partial', 0, 0);
      return { itemsFetched: 0, itemsPushed: 0, skipped: 0 };
    }

    // 1. fetch the user's recent accepted submissions (with code)
    const platformToken = decrypt(connection.secret.tokenCipher, connection.secret.tokenIv);
    const submissions = await adapter.getRecentSubmissions(platformToken, { limit: 20 });

    // 2. diff against already-synced problems
    const existing = await prisma.problem.findMany({
      where: { connectionId, syncedToGit: true },
      select: { slug: true },
    });
    const synced = new Set(existing.map((e) => e.slug));
    const fresh = submissions.filter((s) => !synced.has(s.slug));

    if (fresh.length === 0) {
      await finishRun(run.id, 'success', submissions.length, 0);
      await prisma.notification
        .create({
          data: {
            userId: connection.userId,
            type: 'sync',
            title: `${connection.platform} is up to date`,
            body: `All ${submissions.length} accepted problem(s) already synced.`,
          },
        })
        .catch(() => undefined);
      return { itemsFetched: submissions.length, itemsPushed: 0, skipped: submissions.length };
    }

    // 3. resolve the GitHub repo mapping + the user's GitHub token
    const repo = await prisma.githubRepo.findUnique({
      where: { userId_platform: { userId: connection.userId, platform: connection.platform } },
    });
    if (!repo) throw new NotFoundError('No GitHub repo mapping for this platform');

    const identity = connection.user.oauthIdentities[0];
    if (!identity) throw new NotFoundError('No GitHub identity for user');
    const githubToken = decrypt(identity.accessTokenCipher, identity.tokenIv);

    await verifyRepoAccess(githubToken, repo.repoFullName);

    // 4. build the files for each new problem
    const convention = repo.folderConvention as FolderConvention;
    const files: GithubFile[] = [];
    const items: SolutionToSync[] = [];
    for (const sub of fresh) {
      const question = await adapter.getQuestion(sub.slug);
      const item = toSolutionToSync(sub, question);
      items.push(item);
      files.push({ path: questionPath(item, convention), content: item.questionMarkdown });
      files.push({ path: solutionPath(item, convention), content: item.code });
    }

    // 5. regenerate the index README from existing + new problems
    const entries = await buildIndexEntries(connection.userId, connection.platform as PlatformName, items, convention);
    const repoName = repo.repoFullName.split('/')[1] ?? repo.repoFullName;
    files.push({ path: 'README.md', content: generateReadme(repoName, entries) });

    // 6. push everything in a single commit
    await pushFiles(
      githubToken,
      repo.repoFullName,
      repo.defaultBranch,
      files,
      `CodeVault sync: ${items.length} problem(s) from ${connection.platform}`,
    );

    // 7. persist
    await persist(connection.userId, connectionId, connection.platform as PlatformName, items, convention);
    await prisma.githubRepo.update({
      where: { id: repo.id },
      data: { lastSyncAt: new Date(), fileCount: { increment: items.length } },
    });
    await finishRun(run.id, 'success', submissions.length, items.length);

    // Notify the user (feeds web-backend's notifications feature).
    if (items.length > 0) {
      await prisma.notification
        .create({
          data: {
            userId: connection.userId,
            type: 'sync',
            title: `Synced ${items.length} problem(s) from ${connection.platform}`,
            body: `Pushed to ${repo.repoFullName}.`,
          },
        })
        .catch(() => undefined);
    }

    return { itemsFetched: submissions.length, itemsPushed: items.length, skipped: submissions.length - fresh.length };
  } catch (err) {
    if (err instanceof ExpiredSessionError) {
      await onExpired(run.id, connectionId);
    } else {
      const code = err instanceof AppError ? err.code : 'INTERNAL';
      await finishRun(run.id, 'failed', 0, 0, code);
      // Notify the user about the sync failure.
      await prisma.notification
        .create({
          data: {
            userId: connection.userId,
            type: 'sync',
            title: `Sync failed for ${connection.platform}`,
            body: `Error: ${err instanceof Error ? err.message : code}. Check your repo settings or try again.`,
          },
        })
        .catch(() => undefined);
    }
    throw err;
  }
}

async function buildIndexEntries(
  userId: string,
  platform: PlatformName,
  newItems: SolutionToSync[],
  convention: FolderConvention,
): Promise<RepoFileEntry[]> {
  const all = await prisma.problem.findMany({ where: { userId, platform } });
  const bySlug = new Map<string, RepoFileEntry>();

  for (const p of all) {
    bySlug.set(p.slug, {
      number: p.number,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty ?? undefined,
      language: p.language ?? 'txt',
      solutionPath: p.solutionPath ?? `${padNumber(p.number)}/solution.txt`,
      solvedAt: p.solvedAt?.toISOString().slice(0, 10),
    });
  }

  for (const item of newItems) {
    bySlug.set(item.slug, {
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

  return [...bySlug.values()];
}

async function persist(
  userId: string,
  connectionId: string,
  platform: PlatformName,
  items: SolutionToSync[],
  convention: FolderConvention,
): Promise<void> {
  for (const item of items) {
    await prisma.problem.upsert({
      where: { userId_platform_slug: { userId, platform, slug: item.slug } },
      create: {
        userId,
        connectionId,
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
}

async function finishRun(
  runId: string,
  status: 'success' | 'partial' | 'failed' | 'skipped',
  itemsFetched: number,
  itemsPushed: number,
  errorCode?: string,
): Promise<void> {
  // 'skipped' is not a SyncStatus enum value — record it as 'partial' with no items.
  const dbStatus = status === 'skipped' ? 'partial' : status;
  await prisma.syncRun.update({
    where: { id: runId },
    data: { status: dbStatus, itemsFetched, itemsPushed, errorCode, finishedAt: new Date() },
  });
}

async function onExpired(runId: string, connectionId: string): Promise<void> {
  const connection = await prisma.connection.update({
    where: { id: connectionId },
    data: { tokenStatus: 'expired' },
  });
  await prisma.syncRun.update({
    where: { id: runId },
    data: { status: 'expired', errorCode: 'SESSION_EXPIRED', finishedAt: new Date() },
  });
  await prisma.notification
    .create({
      data: {
        userId: connection.userId,
        type: 'expiry',
        title: `${connection.platform} session expired`,
        body: 'Reconnect to resume code sync — your stats keep working from public data.',
      },
    })
    .catch(() => undefined);
  logger.warn({ connectionId }, 'Sync stopped — platform session expired (reconnect required)');
}
