import { describe, it, expect } from 'vitest';
import { withRlsContext, getRlsUserId } from '../src/lib/rls-context';

describe('RLS context (AsyncLocalStorage — per-request user isolation)', () => {
  it('returns undefined outside any context (public/unauthenticated)', () => {
    expect(getRlsUserId()).toBeUndefined();
  });

  it('exposes the userId inside withRlsContext', () => {
    expect(withRlsContext('user_1', () => getRlsUserId())).toBe('user_1');
  });

  it('returns the callback result', () => {
    expect(withRlsContext('u', () => 42)).toBe(42);
  });

  it('does not leak the context after it returns', () => {
    withRlsContext('user_1', () => getRlsUserId());
    expect(getRlsUserId()).toBeUndefined();
  });

  it('nested contexts use the innermost userId', () => {
    const result = withRlsContext('outer', () =>
      withRlsContext('inner', () => getRlsUserId()),
    );
    expect(result).toBe('inner');
  });

  it('propagates across await', async () => {
    const seen = await withRlsContext('async_user', async () => {
      await new Promise((r) => setTimeout(r, 5));
      return getRlsUserId();
    });
    expect(seen).toBe('async_user');
  });

  it('keeps concurrent request contexts isolated (no cross-user leak)', async () => {
    const a = withRlsContext('A', async () => {
      await new Promise((r) => setTimeout(r, 10));
      return getRlsUserId();
    });
    const b = withRlsContext('B', async () => {
      await new Promise((r) => setTimeout(r, 5));
      return getRlsUserId();
    });
    expect(await Promise.all([a, b])).toEqual(['A', 'B']);
  });
});
