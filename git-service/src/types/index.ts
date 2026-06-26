/**
 * Shared contracts. JwtClaims/AuthUser MUST match web-backend's frozen shape —
 * git-service verifies the same access token.
 */
export type UserRole = 'user' | 'admin';
export type PlatformName = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank';

export interface JwtClaims {
  sub: string;
  role: UserRole;
  handle: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  handle: string;
}

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
