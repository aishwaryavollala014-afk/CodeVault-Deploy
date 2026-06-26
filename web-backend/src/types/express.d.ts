import type { AuthUser } from './index';

/**
 * Express Request augmentation: every request carries a correlation id, and
 * protected requests carry the authenticated user (set by auth middleware).
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthUser;
    }
  }
}

export {};
