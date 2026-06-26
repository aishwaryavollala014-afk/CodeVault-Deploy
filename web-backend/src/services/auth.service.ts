import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { httpClient } from '../lib/httpClient';
import { signAccessToken } from '../lib/jwt';
import { encrypt, sha256, randomToken } from '../lib/crypto';
import { env } from '../config/env';
import { toHandle } from '../utils/helpers';
import { UnauthenticatedError } from '../utils/errors';
import type { AuthUser } from '../types';

const STATE_PREFIX = 'oauth:state:';
const STATE_TTL_SECONDS = 600; // 10 minutes
const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';
const GITHUB_API_USER = 'https://api.github.com/user';
const GITHUB_API_EMAILS = 'https://api.github.com/user/emails';

interface GithubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Build the GitHub authorize URL and persist a one-time `state` (anti-CSRF). */
export async function createGithubAuthUrl(next?: string): Promise<{ url: string }> {
  const state = randomToken(24);
  await redis.set(`${STATE_PREFIX}${state}`, next ?? '/', 'EX', STATE_TTL_SECONDS);

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email repo',
    state,
    allow_signup: 'true',
  });
  return { url: `${GITHUB_AUTHORIZE}?${params.toString()}` };
}

/** Exchange the OAuth code, upsert the user, and mint a session. */
export async function handleGithubCallback(
  code: string,
  state: string,
): Promise<SessionTokens & { user: AuthUser; next: string }> {
  // 1. Validate state (single-use, anti-CSRF).
  const stateKey = `${STATE_PREFIX}${state}`;
  const next = await redis.get(stateKey);
  if (next === null) throw new UnauthenticatedError('Invalid or expired OAuth state');
  await redis.del(stateKey);

  // 2. Exchange code -> GitHub access token.
  const tokenRes = await httpClient.post(
    GITHUB_TOKEN,
    {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    },
    { headers: { Accept: 'application/json' } },
  );
  const githubToken: string | undefined = tokenRes.data?.access_token;
  if (!githubToken) throw new UnauthenticatedError('GitHub token exchange failed');

  // 3. Fetch profile (+ primary verified email).
  const authHeader = { headers: { Authorization: `Bearer ${githubToken}` } };
  const profile = (await httpClient.get<GithubProfile>(GITHUB_API_USER, authHeader)).data;
  let email = profile.email;
  if (!email) {
    const emails = (await httpClient.get<Array<{ email: string; primary: boolean; verified: boolean }>>(
      GITHUB_API_EMAILS,
      authHeader,
    )).data;
    email = emails.find((e) => e.primary && e.verified)?.email ?? null;
  }

  // 4. Upsert user + encrypted GitHub token.
  const user = await prisma.user.upsert({
    where: { githubLogin: profile.login.toLowerCase() },
    create: {
      githubLogin: profile.login.toLowerCase(),
      handle: await uniqueHandle(toHandle(profile.login)),
      displayName: profile.name ?? profile.login,
      email: email ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
    },
    update: {
      displayName: profile.name ?? undefined,
      avatarUrl: profile.avatar_url ?? undefined,
      email: email ?? undefined,
    },
  });

  const { cipher, iv } = encrypt(githubToken);
  await prisma.oAuthIdentity.upsert({
    where: { provider_providerUserId: { provider: 'github', providerUserId: String(profile.id) } },
    create: {
      userId: user.id,
      provider: 'github',
      providerUserId: String(profile.id),
      accessTokenCipher: cipher,
      tokenIv: iv,
      scopes: ['read:user', 'user:email', 'repo'],
    },
    update: { accessTokenCipher: cipher, tokenIv: iv },
  });

  // 5. Issue session.
  const authUser: AuthUser = { id: user.id, role: user.role, handle: user.handle };
  const tokens = await issueSession(authUser, randomUUID());
  return { ...tokens, user: authUser, next: next || '/' };
}

/** Rotate a refresh token: revoke the old, issue a new one in the same family. */
export async function refreshSession(rawRefreshToken: string): Promise<SessionTokens> {
  const hash = sha256(rawRefreshToken);
  const session = await prisma.authSession.findUnique({ where: { refreshTokenHash: hash } });
  if (!session) throw new UnauthenticatedError('Invalid refresh token');

  // Reuse detection: a revoked/expired token being replayed -> kill the family.
  if (session.revokedAt || session.expiresAt < new Date()) {
    await prisma.authSession.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthenticatedError('Refresh token reuse detected — session revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.deletedAt) throw new UnauthenticatedError('Account unavailable');

  await prisma.authSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  const authUser: AuthUser = { id: user.id, role: user.role, handle: user.handle };
  return issueSession(authUser, session.familyId);
}

/** Revoke a session (logout). */
export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  await prisma.authSession.updateMany({
    where: { refreshTokenHash: sha256(rawRefreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Create an access JWT + persist a hashed refresh token. */
async function issueSession(user: AuthUser, familyId: string): Promise<SessionTokens> {
  const accessToken = signAccessToken(user);
  const refreshToken = randomToken();
  await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: sha256(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL * 1000),
    },
  });
  return { accessToken, refreshToken };
}

/** Ensure a globally-unique handle, appending a short suffix on collision. */
async function uniqueHandle(base: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 5; i += 1) {
    const exists = await prisma.user.findUnique({ where: { handle: candidate } });
    if (!exists) return candidate;
    candidate = `${base.slice(0, 25)}-${randomToken(2).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  }
  return `${base.slice(0, 20)}-${Date.now().toString(36)}`;
}
