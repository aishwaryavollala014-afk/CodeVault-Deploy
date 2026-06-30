// MV3 manifest for the CodeVault extension (Path B v2). A bundler (WXT / CRXJS + Vite)
// resolves the src/* entry paths to built assets. Least-privilege: only the four platform
// hosts + the CodeVault API hosts; storage/scripting/identity only.
export default {
  manifest_version: 3,
  name: 'CodeVault',
  version: '0.1.0',
  description: 'Capture your accepted solutions and sync them to GitHub via CodeVault.',
  permissions: ['storage', 'scripting', 'identity'],
  host_permissions: [
    'https://leetcode.com/*',
    'https://codeforces.com/*',
    'https://www.codechef.com/*',
    'https://www.hackerrank.com/*',
    'http://localhost:5000/*',
    'http://localhost:5050/*',
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    { matches: ['https://leetcode.com/problems/*'], js: ['src/content/leetcode.ts'], run_at: 'document_idle' },
    { matches: ['https://codeforces.com/*'], js: ['src/content/codeforces.ts'], run_at: 'document_idle' },
    { matches: ['https://www.codechef.com/*'], js: ['src/content/codechef.ts'], run_at: 'document_idle' },
    { matches: ['https://www.hackerrank.com/challenges/*'], js: ['src/content/hackerrank.ts'], run_at: 'document_idle' },
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
} as const;
