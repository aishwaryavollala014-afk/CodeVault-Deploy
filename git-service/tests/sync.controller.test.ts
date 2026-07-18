import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  default: {
    connection: { findUnique: vi.fn(), findMany: vi.fn() },
    syncRun: { findMany: vi.fn() },
  },
}));
vi.mock('../src/jobs/queue', () => ({ enqueueSync: vi.fn() }));

import prisma from '../src/lib/prisma';
import { enqueueSync } from '../src/jobs/queue';
import { trigger, status, activity } from '../src/controllers/sync.controller';
import { ForbiddenError, NotFoundError } from '../src/utils/errors';

const p = prisma as any;
const enqueue = enqueueSync as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res;
}
const req = (body: any = {}, query: any = {}) => ({ user: { userId: 'user_1' }, body, query } as any);

beforeEach(() => vi.clearAllMocks());

describe('POST /api/sync trigger', () => {
  it('rejects a connectionId owned by another user (403) and does not enqueue', async () => {
    p.connection.findUnique.mockResolvedValue({ userId: 'someone_else', deletedAt: null });
    await expect(trigger(req({ connectionId: 'c1' }), mockRes())).rejects.toBeInstanceOf(ForbiddenError);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it('404s for a missing or soft-deleted connection', async () => {
    p.connection.findUnique.mockResolvedValue(null);
    await expect(trigger(req({ connectionId: 'c1' }), mockRes())).rejects.toBeInstanceOf(NotFoundError);
    p.connection.findUnique.mockResolvedValue({ userId: 'user_1', deletedAt: new Date() });
    await expect(trigger(req({ connectionId: 'c1' }), mockRes())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('enqueues a single owned connection → 202 with the job id', async () => {
    p.connection.findUnique.mockResolvedValue({ userId: 'user_1', deletedAt: null });
    enqueue.mockResolvedValue('job_1');
    const res = mockRes();
    await trigger(req({ connectionId: 'c1' }), res);
    expect(enqueue).toHaveBeenCalledWith({ connectionId: 'c1', trigger: 'manual' });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ accepted: true, jobs: ['job_1'] });
  });

  it('with no connectionId enqueues all the caller’s sync-enabled connections', async () => {
    p.connection.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    enqueue.mockResolvedValue('j');
    const res = mockRes();
    await trigger(req({}), res);
    expect(p.connection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1', syncEnabled: true, deletedAt: null } }),
    );
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ accepted: true, count: 2 });
  });
});

describe('GET /api/sync/status', () => {
  it('maps connections to status items (expired vs active, itemsSynced from _count)', async () => {
    p.connection.findMany.mockResolvedValue([
      { id: 'c1', platform: 'leetcode', username: 'u', tokenStatus: 'active', syncEnabled: true, lastSyncedAt: null, _count: { problems: 5 } },
      { id: 'c2', platform: 'codechef', username: 'v', tokenStatus: 'expired', syncEnabled: true, lastSyncedAt: null, _count: { problems: 0 } },
    ]);
    const res = mockRes();
    await status(req(), res);
    const { items } = res.json.mock.calls[0][0];
    expect(items[0]).toMatchObject({ connectionId: 'c1', status: 'active', itemsSynced: 5 });
    expect(items[1]).toMatchObject({ connectionId: 'c2', status: 'expired', itemsSynced: 0 });
  });
});

describe('GET /api/sync/activity', () => {
  it('maps runs to typed messages and paginates via nextCursor', async () => {
    // limit=2 → take 3; return 3 → hasMore, page=2
    p.syncRun.findMany.mockResolvedValue([
      { id: 'r1', status: 'success', itemsPushed: 3, itemsFetched: 3, errorCode: null, createdAt: new Date(), connection: { platform: 'leetcode', username: 'u' } },
      { id: 'r2', status: 'failed', itemsPushed: 0, itemsFetched: 0, errorCode: 'INGEST_FAILED', createdAt: new Date(), connection: { platform: 'codechef', username: 'v' } },
      { id: 'r3', status: 'expired', itemsPushed: 0, itemsFetched: 0, errorCode: 'SESSION_EXPIRED', createdAt: new Date(), connection: { platform: 'codeforces', username: 'w' } },
    ]);
    const res = mockRes();
    await activity(req({}, { limit: '2' }), res);
    const out = res.json.mock.calls[0][0];
    expect(out.items).toHaveLength(2);
    expect(out.items[0]).toMatchObject({ type: 'push', message: 'Synced 3 problem(s) from leetcode' });
    expect(out.items[1]).toMatchObject({ type: 'error', message: 'Sync failed for codechef (INGEST_FAILED)' });
    expect(out.nextCursor).toBe('r2'); // last of the trimmed page
  });

  it('returns nextCursor null when there is no further page', async () => {
    p.syncRun.findMany.mockResolvedValue([
      { id: 'r1', status: 'running', itemsPushed: 0, itemsFetched: 0, errorCode: null, createdAt: new Date(), connection: { platform: 'leetcode', username: 'u' } },
    ]);
    const res = mockRes();
    await activity(req({}, {}), res);
    const out = res.json.mock.calls[0][0];
    expect(out.nextCursor).toBeNull();
    expect(out.items[0].type).toBe('fetch');
  });
});
