import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  default: {
    connection: { findUnique: vi.fn(), update: vi.fn() },
    syncRun: { create: vi.fn(), update: vi.fn() },
    problem: { findMany: vi.fn(), upsert: vi.fn() },
    githubRepo: { findUnique: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock('../src/lib/crypto', () => ({ decrypt: vi.fn(() => 'token') }));
vi.mock('../src/services/github/github.service', () => ({ verifyRepoAccess: vi.fn(), pushFiles: vi.fn() }));
vi.mock('../src/services/github/readme.generator', () => ({ generateReadme: vi.fn(() => '# README') }));
vi.mock('../src/services/submissions', () => ({ getSubmissionAdapter: vi.fn() }));
vi.mock('../src/lib/logger', () => ({ default: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } }));

import prisma from '../src/lib/prisma';
import { getSubmissionAdapter } from '../src/services/submissions';
import { verifyRepoAccess, pushFiles } from '../src/services/github/github.service';
import { runSync } from '../src/services/sync.service';
import { ExpiredSessionError } from '../src/utils/errors';

const p = prisma as any;

const submission = {
  platform: 'leetcode', number: '1', slug: 'two-sum', title: 'Two Sum',
  topics: [], language: 'python3', code: 'print(1)',
};
const question = { slug: 'two-sum', number: '1', title: 'Two Sum', topics: [], statementMarkdown: 'stmt' };

const happyConnection = () => ({
  id: 'conn1',
  userId: 'user_1',
  platform: 'leetcode',
  syncEnabled: true,
  secret: { tokenCipher: Buffer.from('t'), tokenIv: Buffer.from('i') },
  user: { oauthIdentities: [{ accessTokenCipher: Buffer.from('a'), tokenIv: Buffer.from('b') }] },
});

let adapter: any;

beforeEach(() => {
  vi.clearAllMocks();
  adapter = {
    supportsCodeSync: true,
    getRecentSubmissions: vi.fn().mockResolvedValue([submission]),
    getQuestion: vi.fn().mockResolvedValue(question),
  };
  (getSubmissionAdapter as any).mockReturnValue(adapter);

  p.connection.findUnique.mockResolvedValue(happyConnection());
  p.connection.update.mockResolvedValue({ userId: 'user_1', platform: 'leetcode' });
  p.syncRun.create.mockResolvedValue({ id: 'run1' });
  p.syncRun.update.mockResolvedValue({});
  p.problem.findMany.mockResolvedValue([]); // nothing synced yet
  p.problem.upsert.mockResolvedValue({});
  p.githubRepo.findUnique.mockResolvedValue({
    id: 'repo1', repoFullName: 'me/lc', folderConvention: 'number', defaultBranch: 'main',
  });
  p.githubRepo.update.mockResolvedValue({});
  p.notification.create.mockResolvedValue({});
});

describe('runSync orchestrator', () => {
  it('throws when the connection does not exist', async () => {
    p.connection.findUnique.mockResolvedValue(null);
    await expect(runSync('missing')).rejects.toThrow(/not found/i);
  });

  it('skips when sync is disabled (no adapter fetch, no push)', async () => {
    p.connection.findUnique.mockResolvedValue({ ...happyConnection(), syncEnabled: false });
    const result = await runSync('conn1');
    expect(result).toEqual({ itemsFetched: 0, itemsPushed: 0, skipped: 0 });
    expect(adapter.getRecentSubmissions).not.toHaveBeenCalled();
    expect(pushFiles).not.toHaveBeenCalled();
  });

  it('skips platforms whose adapter does not support code sync', async () => {
    adapter.supportsCodeSync = false;
    const result = await runSync('conn1');
    expect(result.itemsPushed).toBe(0);
    expect(pushFiles).not.toHaveBeenCalled();
  });

  it('does not push when everything is already synced', async () => {
    p.problem.findMany.mockResolvedValueOnce([{ slug: 'two-sum' }]); // existing synced
    const result = await runSync('conn1');
    expect(result).toEqual({ itemsFetched: 1, itemsPushed: 0, skipped: 1 });
    expect(verifyRepoAccess).not.toHaveBeenCalled();
    expect(pushFiles).not.toHaveBeenCalled();
  });

  it('fetches, pushes and persists a fresh submission', async () => {
    const result = await runSync('conn1');
    expect(result).toEqual({ itemsFetched: 1, itemsPushed: 1, skipped: 0 });

    expect(adapter.getQuestion).toHaveBeenCalledWith('two-sum');
    const [token, repoFullName, branch, files] = (pushFiles as any).mock.calls[0];
    expect(token).toBe('token');
    expect(repoFullName).toBe('me/lc');
    expect(branch).toBe('main');
    const paths = files.map((f: any) => f.path);
    expect(paths).toEqual(expect.arrayContaining(['0001/question.md', '0001/solution.py', 'README.md']));
    expect(p.problem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_platform_slug: { userId: 'user_1', platform: 'leetcode', slug: 'two-sum' } },
      }),
    );
  });

  it('on an expired platform session: marks the connection expired and rethrows', async () => {
    adapter.getRecentSubmissions.mockRejectedValue(new ExpiredSessionError());
    await expect(runSync('conn1')).rejects.toBeInstanceOf(ExpiredSessionError);

    expect(p.connection.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'conn1' }, data: { tokenStatus: 'expired' } }),
    );
    expect(p.syncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'expired', errorCode: 'SESSION_EXPIRED' }) }),
    );
    expect(pushFiles).not.toHaveBeenCalled();
  });
});
