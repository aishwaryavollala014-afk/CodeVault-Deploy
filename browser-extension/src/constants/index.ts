// Shared constants for the CodeVault extension. Vite injects the VITE_* vars at build time
// (via import.meta.env — NOT process.env, which is undefined in a browser bundle); each
// falls back to local-dev defaults.

// git-service base URL — the extension POSTs captured submissions to `${GIT_SERVICE_URL}/ingest`.
export const GIT_SERVICE_URL =
  (import.meta.env?.VITE_GIT_SERVICE_URL as string | undefined) || 'http://localhost:5050/api';

// The CodeVault web app — opened so the user can sign in; the codevault content script then
// reads the JWT from its localStorage and hands it to the background worker.
export const WEB_APP_URL =
  (import.meta.env?.VITE_WEB_APP_URL as string | undefined) || 'http://localhost:3000';

// Platform hosts the content scripts run on (kept in sync with manifest host_permissions).
export const PLATFORM_HOSTS = {
  leetcode: 'https://leetcode.com',
  codeforces: 'https://codeforces.com',
  codechef: 'https://www.codechef.com',
  hackerrank: 'https://www.hackerrank.com',
} as const;
