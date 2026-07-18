/**
 * API endpoints. The phone cannot reach the laptop's `localhost`, so these
 * default to the dev machine's LAN IP. Override via a `.env` file with
 * EXPO_PUBLIC_WEB_API / EXPO_PUBLIC_GIT_API (see .env.example).
 *
 *   web-backend  → :4000  (auth, stats, connections, settings, social, ...)
 *   git-service  → :5050  (sync, repos, problems, ingest)
 */
const LAN = '172.20.10.2';

export const WEB_API =
  process.env.EXPO_PUBLIC_WEB_API ?? `http://${LAN}:4000/api`;

export const GIT_API =
  process.env.EXPO_PUBLIC_GIT_API ?? `http://${LAN}:5050/api`;

export const PLATFORMS = ['leetcode', 'codeforces', 'codechef', 'hackerrank'] as const;
export type Platform = (typeof PLATFORMS)[number];
