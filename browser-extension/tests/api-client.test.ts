import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/storage', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

import { mintToken, postIngest, getRecentProblems } from '../src/lib/api-client';
import * as storage from '../src/lib/storage';

const getToken = storage.getToken as unknown as ReturnType<typeof vi.fn>;
const setToken = storage.setToken as unknown as ReturnType<typeof vi.fn>;
const clearToken = storage.clearToken as unknown as ReturnType<typeof vi.fn>;

const resp = (status: number, body: any = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  setToken.mockResolvedValue(undefined);
  clearToken.mockResolvedValue(undefined);
  getToken.mockResolvedValue(null);
});

describe('mintToken', () => {
  it('returns and stores the token on the first try', async () => {
    fetchMock.mockResolvedValueOnce(resp(200, { token: 'tok1' }));
    expect(await mintToken()).toBe('tok1');
    expect(setToken).toHaveBeenCalledWith('tok1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/extension-token');
  });

  it('rotates via /auth/refresh when the access cookie is expired, then retries', async () => {
    fetchMock
      .mockResolvedValueOnce(resp(401)) // extension-token fails (access cookie expired)
      .mockResolvedValueOnce(resp(200)) // refresh succeeds
      .mockResolvedValueOnce(resp(200, { token: 'tok2' })); // extension-token retry
    expect(await mintToken()).toBe('tok2');
    expect(setToken).toHaveBeenCalledWith('tok2');
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls[1]).toContain('/auth/refresh');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST' });
  });

  it('clears the token and returns null when the user is not signed in', async () => {
    fetchMock
      .mockResolvedValueOnce(resp(401)) // extension-token
      .mockResolvedValueOnce(resp(401)) // refresh
      .mockResolvedValueOnce(resp(401)); // extension-token retry
    expect(await mintToken()).toBeNull();
    expect(clearToken).toHaveBeenCalled();
    expect(setToken).not.toHaveBeenCalled();
  });
});

describe('postIngest', () => {
  it('posts with the stored token (no mint needed)', async () => {
    getToken.mockResolvedValue('tok');
    fetchMock.mockResolvedValueOnce(resp(202, { accepted: 1, pushed: 1, skipped: 0 }));
    const r = await postIngest([{ slug: 'x' } as any]);
    expect(r).toEqual({ ok: true, accepted: 1, pushed: 1, skipped: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1] as any).headers.Authorization).toBe('Bearer tok');
  });

  it('mints a token when none is stored', async () => {
    getToken.mockResolvedValue(null);
    fetchMock
      .mockResolvedValueOnce(resp(200, { token: 'minted' })) // mintToken
      .mockResolvedValueOnce(resp(202, { accepted: 0, pushed: 0, skipped: 0 }));
    const r = await postIngest([{ slug: 'x' } as any]);
    expect(r.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/extension-token');
    expect((fetchMock.mock.calls[1][1] as any).headers.Authorization).toBe('Bearer minted');
  });

  it('re-mints and retries exactly once on a 401', async () => {
    getToken.mockResolvedValue('oldtok');
    fetchMock
      .mockResolvedValueOnce(resp(401)) // ingest with oldtok → 401
      .mockResolvedValueOnce(resp(200, { token: 'newtok' })) // mintToken
      .mockResolvedValueOnce(resp(202, { accepted: 1, pushed: 1, skipped: 0 })); // retry
    const r = await postIngest([{ slug: 'x' } as any]);
    expect(r.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[2][1] as any).headers.Authorization).toBe('Bearer newtok');
  });

  it('returns not_signed_in when a token cannot be obtained', async () => {
    getToken.mockResolvedValue(null);
    fetchMock.mockResolvedValue(resp(401)); // every mint attempt fails
    const r = await postIngest([{ slug: 'x' } as any]);
    expect(r).toEqual({ ok: false, error: 'not_signed_in' });
  });

  it('surfaces the backend error code on a non-401 failure', async () => {
    getToken.mockResolvedValue('tok');
    fetchMock.mockResolvedValueOnce(resp(400, { error: { code: 'VALIDATION_ERROR' } }));
    const r = await postIngest([{ slug: 'x' } as any]);
    expect(r).toEqual({ ok: false, error: 'VALIDATION_ERROR' });
  });
});

describe('getRecentProblems', () => {
  it('re-mints and retries on 401', async () => {
    getToken.mockResolvedValue('oldtok');
    fetchMock
      .mockResolvedValueOnce(resp(401))
      .mockResolvedValueOnce(resp(200, { token: 'newtok' }))
      .mockResolvedValueOnce(resp(200, { items: [{ slug: 'a' }] }));
    const r = await getRecentProblems();
    expect(r).toEqual({ ok: true, items: [{ slug: 'a' }] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
