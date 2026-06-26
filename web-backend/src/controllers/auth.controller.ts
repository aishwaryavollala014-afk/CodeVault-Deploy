import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../middlewares/auth.middleware';
import { githubStartSchema, githubCallbackSchema } from '../validators/auth.validator';
import { env, isProd } from '../config/env';
import { UnauthenticatedError } from '../utils/errors';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const, path: '/' };
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, maxAge: env.JWT_ACCESS_TTL * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, maxAge: env.JWT_REFRESH_TTL * 1000 });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

/** GET /auth/github/start — redirect to GitHub. */
export async function startGithub(req: Request, res: Response): Promise<void> {
  const { next } = githubStartSchema.parse(req.query);
  const { url } = await authService.createGithubAuthUrl(next);
  res.redirect(url);
}

/** GET /auth/github/callback — exchange code, set cookies, bounce to the app. */
export async function githubCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = githubCallbackSchema.parse(req.query);
  const { accessToken, refreshToken, next } = await authService.handleGithubCallback(code, state);
  setAuthCookies(res, accessToken, refreshToken);
  res.redirect(`${env.CORS_ORIGIN}${next}`);
}

/** GET /auth/session — current user (FE bootstrap). */
export async function session(req: Request, res: Response): Promise<void> {
  const user = await userService.getMe(req.user!.id);
  res.status(200).json(user);
}

/** POST /auth/refresh — rotate tokens. */
export async function refresh(req: Request, res: Response): Promise<void> {
  const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  if (!raw) throw new UnauthenticatedError('No refresh token');
  const { accessToken, refreshToken } = await authService.refreshSession(raw);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(204).end();
}

/** POST /auth/logout — revoke session + clear cookies. */
export async function logout(req: Request, res: Response): Promise<void> {
  const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  await authService.logout(raw);
  clearAuthCookies(res);
  res.status(204).end();
}
