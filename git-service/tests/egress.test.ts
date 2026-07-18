import { describe, it, expect } from 'vitest';
import { assertAllowedUrl } from '../src/lib/egress';

describe('egress allowlist (SSRF defense)', () => {
  it('allows the four platform hosts + GitHub API', () => {
    for (const url of [
      'https://leetcode.com/graphql',
      'https://codeforces.com/data/submitSource',
      'https://www.codechef.com/viewplaintext/1',
      'https://codechef.com/problems/X',
      'https://www.hackerrank.com/rest/x',
      'https://hackerrank.com/x',
      'https://api.github.com/repos/a/b',
    ]) {
      expect(() => assertAllowedUrl(url)).not.toThrow();
    }
  });

  it('blocks non-allowlisted hosts', () => {
    expect(() => assertAllowedUrl('https://evil.example.com/x')).toThrow(/non-allowlisted/);
  });

  it('blocks SSRF to internal / cloud-metadata endpoints', () => {
    for (const url of [
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://localhost:5432',
      'http://127.0.0.1/admin',
      'http://10.0.0.5/internal',
    ]) {
      expect(() => assertAllowedUrl(url)).toThrow();
    }
  });

  it('rejects malformed URLs', () => {
    expect(() => assertAllowedUrl('not-a-url')).toThrow(/invalid URL/);
    expect(() => assertAllowedUrl('')).toThrow();
  });

  it('is case-insensitive on the host', () => {
    expect(() => assertAllowedUrl('https://LeetCode.com/graphql')).not.toThrow();
  });
});
