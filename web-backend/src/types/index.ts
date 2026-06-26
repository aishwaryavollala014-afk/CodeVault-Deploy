/**
 * Frozen API + auth contracts (M0 contract freeze).
 * These shapes are shared with git-service and the frontend. Any change here
 * is a breaking change — update docs/API_CONTRACT.md in the same PR.
 */

// ----------------------------- auth -----------------------------

export type UserRole = 'user' | 'admin';

/** JWT access-token claims. git-service verifies this exact shape. */
export interface JwtClaims {
  sub: string; // user id
  role: UserRole;
  handle: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/** Attached to req.user after auth middleware verifies the JWT. */
export interface AuthUser {
  id: string;
  role: UserRole;
  handle: string;
}

// ----------------------------- platforms -----------------------------

export type PlatformName = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank';

export const PLATFORMS: readonly PlatformName[] = [
  'leetcode',
  'codeforces',
  'codechef',
  'hackerrank',
] as const;

// ----------------------------- response envelopes -----------------------------

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

// ----------------------------- stats contract -----------------------------

/** Unified dashboard analytics returned by GET /api/stats (Path A). */
export interface AggregatedStats {
  totalSolved: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  byPlatform: Array<{ platform: PlatformName; solved: number; pct: number }>;
  byTopic: Array<{ name: string; count: number }>;
  byLanguage: Array<{ name: string; count: number }>;
  streak: { current: number; longest: number };
  ratings: Array<{ platform: PlatformName; current: number; peak: number }>;
  heatmap: Array<{ date: string; count: number }>;
  syncedToGit: { count: number; pct: number };
  /** Platforms that failed to fetch this cycle (partial-failure flag). */
  degraded: PlatformName[];
}

// ----------------------------- health -----------------------------

export interface HealthStatus {
  status: 'ok';
  service: string;
  uptime: number;
  timestamp: string;
}

export interface ReadinessStatus {
  status: 'ready' | 'degraded';
  checks: { database: boolean; redis: boolean };
  timestamp: string;
}
