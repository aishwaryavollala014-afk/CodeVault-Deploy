import { describe, it, expect, vi } from 'vitest';
import { csrfMiddleware } from '../csrf.middleware';

function ctx(over: Partial<{ method: string; path: string; cookies: any; headers: any }> = {}) {
  const req: any = {
    method: over.method ?? 'GET',
    path: over.path ?? '/api/settings',
    cookies: over.cookies ?? {},
    headers: over.headers ?? {},
  };
  const res: any = { cookie: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
}

describe('csrfMiddleware (double-submit cookie)', () => {
  it('passes non-mutating GET requests and seeds a token cookie', () => {
    const { req, res, next } = ctx({ method: 'GET' });
    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.cookie).toHaveBeenCalledWith('csrf-token', expect.any(String), expect.any(Object));
  });

  it('exempts pre-auth routes so LOGIN is never blocked (regression guard)', () => {
    for (const path of ['/api/auth/github', '/api/auth/email', '/api/health']) {
      const { req, res, next } = ctx({ method: 'POST', path });
      csrfMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(403);
    }
  });

  it('exempts Bearer-authenticated requests (native/mobile — not cookie-based)', () => {
    const { req, res, next } = ctx({ method: 'POST', headers: { authorization: 'Bearer abc.def.ghi' } });
    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('rejects a mutation with no CSRF header (403)', () => {
    const { req, res, next } = ctx({ method: 'POST', cookies: { 'csrf-token': 'tok' }, headers: {} });
    csrfMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a mutation when header does not match the cookie (403)', () => {
    const { req, res, next } = ctx({
      method: 'POST',
      cookies: { 'csrf-token': 'tok' },
      headers: { 'x-csrf-token': 'WRONG' },
    });
    csrfMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a mutation when the header matches the cookie', () => {
    const { req, res, next } = ctx({
      method: 'POST',
      cookies: { 'csrf-token': 'tok' },
      headers: { 'x-csrf-token': 'tok' },
    });
    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });
});
