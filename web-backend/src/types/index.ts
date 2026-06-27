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

/** Recent solved problem row for GET /stats/recent. */
export interface SubmissionSummary {
  title: string;
  platform: PlatformName;
  number: string | null;
  difficulty: string | null;
  language: string | null;
  solvedAt: string | null;
  syncedPath: string | null;
}

// ----------------------------- public profile -----------------------------

/** Public, no-auth profile for /u/[username]. NEVER includes email or tokens. */
export interface PublicProfile {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalSolved: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  byPlatform: Array<{ platform: PlatformName; solved: number; pct: number }>;
  byTopic: Array<{ name: string; count: number }>;
  byLanguage: Array<{ name: string; count: number }>;
  ratings: Array<{ platform: PlatformName; current: number; peak: number }>;
  bestStreak: number;
}

// ----------------------------- settings -----------------------------

export interface AppSettings {
  sync: {
    autoSync: boolean;
    frequency: '3h' | '6h' | 'daily';
    includeQuestion: boolean;
    maintainReadme: boolean;
    onlyAccepted: boolean;
  };
  publicProfile: { enabled: boolean; visibleSections: string[] };
  notifications: { syncFailures: boolean; weeklySummary: boolean; productUpdates: boolean };
  appearance: { theme: 'light' | 'dark' | 'system' };
}

export const DEFAULT_SETTINGS: AppSettings = {
  sync: {
    autoSync: false,
    frequency: '6h',
    includeQuestion: true,
    maintainReadme: true,
    onlyAccepted: true,
  },
  publicProfile: { enabled: true, visibleSections: ['stats', 'topics', 'languages'] },
  notifications: { syncFailures: true, weeklySummary: false, productUpdates: false },
  appearance: { theme: 'system' },
};

export interface RepoMappingDto {
  platform: PlatformName;
  repoFullName: string;
  visibility: 'public' | 'private';
  folderConvention: 'number' | 'difficulty' | 'topic';
  defaultBranch: string;
  fileCount: number;
  lastSyncAt: string | null;
}

// ----------------------------- notifications -----------------------------

export type NotificationType = 'sync' | 'expiry' | 'badge' | 'repo' | 'system';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
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
