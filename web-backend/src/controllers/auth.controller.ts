import { Request, Response } from 'express';
import { AuthService, AuthResult } from '../services/auth.service';
import { env } from '../config/env';
import logger from '../lib/logger';

const REFRESH_COOKIE = 'cv_refresh';
const ACCESS_COOKIE = 'cv_access';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes in ms

/** Set the refresh-token HttpOnly cookie on the response. */
function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',  // only sent to auth endpoints
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

/** Clear the refresh-token cookie. */
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
  });
}

/** Set the access-token HttpOnly cookie on the response. */
function setAccessCookie(res: Response, accessToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api',  // sent to all API endpoints
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
}

/** Clear the access-token cookie. */
function clearAccessCookie(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api',
  });
}

/** Build the JSON response body (access token + user, never the refresh token). */
function buildAuthResponse(result: AuthResult) {
  return {
    accessToken: result.accessToken,
    user: result.user,
  };
}

export class AuthController {
  static async githubCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Authorization code is required' });
        return;
      }

      const result = await AuthService.authenticateWithGitHub(code, req);

      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      res.json(buildAuthResponse(result));
    } catch (error: any) {
      logger.error(error, 'Auth Controller Error');
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    // req.user is guaranteed to exist because of requireAuth middleware
    res.json({ message: 'You are authenticated!', user: req.user });
  }

  static async requestEmailLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      await AuthService.sendMagicLink(email);
      res.json({ message: 'Magic link sent successfully!' });
    } catch (error: any) {
      logger.error(error, 'Auth Controller requestEmailLogin Error');
      res.status(500).json({ error: 'Email sign-in failed. Please try again.' });
    }
  }

  static async verifyEmailLogin(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const result = await AuthService.verifyMagicLink(token, req);

      setRefreshCookie(res, result.refreshToken);
      setAccessCookie(res, result.accessToken);
      res.json(buildAuthResponse(result));
    } catch (error: any) {
      logger.error(error, 'Auth Controller verifyEmailLogin Error');
      res.status(400).json({ error: 'Verification failed. The link may have expired.' });
    }
  }

  /**
   * POST /api/auth/refresh
   * Reads the refresh token from the HttpOnly cookie, rotates the session,
   * and returns a new access token + sets a new refresh cookie.
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const oldRefreshToken = req.cookies?.[REFRESH_COOKIE];

      if (!oldRefreshToken || typeof oldRefreshToken !== 'string') {
        res.status(401).json({ error: 'Missing refresh token' });
        return;
      }

      const tokens = await AuthService.refreshSession(oldRefreshToken, req);

      setRefreshCookie(res, tokens.refreshToken);
      setAccessCookie(res, tokens.accessToken);
      res.json({ accessToken: tokens.accessToken });
    } catch (error: any) {
      // On any refresh failure, clear the cookie so the client doesn't retry
      clearRefreshCookie(res);
      logger.warn({ err: error.message }, 'Token refresh failed');
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
  }

  /**
   * POST /api/auth/logout
   * Revokes the session and clears the refresh cookie.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE];

      if (refreshToken && typeof refreshToken === 'string') {
        await AuthService.revokeSession(refreshToken);
      }

      clearRefreshCookie(res);
      clearAccessCookie(res);
      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      logger.error(error, 'Auth Controller logout Error');
      clearRefreshCookie(res);
      clearAccessCookie(res);
      res.json({ message: 'Logged out' });
    }
  }
}
