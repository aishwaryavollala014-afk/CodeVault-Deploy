import { describe, it, expect } from 'vitest';
import { githubApi } from '../src/lib/github';
import { httpClient } from '../src/lib/httpClient';
import { egressInterceptor } from '../src/lib/egress';

describe('githubApi client', () => {
  it('is configured for the GitHub REST API with the caller token', () => {
    const c = githubApi('tok_ABC123');
    expect(c.defaults.baseURL).toBe('https://api.github.com');
    expect(c.defaults.timeout).toBe(20000);
    const headers = JSON.stringify(c.defaults.headers);
    expect(headers).toContain('Bearer tok_ABC123');
    expect(headers).toContain('2022-11-28'); // pinned API version
    expect(headers).toContain('CodeVault-git-service');
  });
});

describe('httpClient defaults', () => {
  it('has a sane timeout and identifies itself', () => {
    expect(httpClient.defaults.timeout).toBe(15000);
    expect(JSON.stringify(httpClient.defaults.headers)).toContain('CodeVault-git-service');
  });
});

describe('egressInterceptor (SSRF guard on the resolved URL)', () => {
  it('allows a baseURL + relative path that resolves to an allowlisted host', () => {
    const cfg = { baseURL: 'https://api.github.com', url: '/repos/a/b', headers: {} } as any;
    expect(() => egressInterceptor(cfg)).not.toThrow();
    expect(egressInterceptor(cfg)).toBe(cfg); // passes the config through unchanged
  });

  it('allows an absolute allowlisted URL', () => {
    const cfg = { baseURL: '', url: 'https://leetcode.com/graphql', headers: {} } as any;
    expect(() => egressInterceptor(cfg)).not.toThrow();
  });

  it('blocks a resolved URL to a non-allowlisted host', () => {
    const cfg = { baseURL: '', url: 'https://evil.example.com/x', headers: {} } as any;
    expect(() => egressInterceptor(cfg)).toThrow(/non-allowlisted/);
  });
});
