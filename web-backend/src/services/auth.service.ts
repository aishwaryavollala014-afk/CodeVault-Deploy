import axios from 'axios';
import crypto from 'crypto';
import prisma, { adminPrisma } from '../lib/prisma';
import logger from '../lib/logger';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import { encryptToken } from '../lib/crypto';
import { MailerService } from './mailer.service';
import { Request } from 'express';

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface UserPayload {
  id: string;
  handle: string;
  githubLogin: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserPayload;
}

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  /**
   * Create a new auth session with access + refresh tokens.
   * Each login starts a new "family" for rotation-based reuse detection.
   */
  private static async createSession(
    userId: string,
    req: Request,
    familyId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = signToken({ userId });

    // Generate opaque refresh token and hash it for storage
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await adminPrisma.authSession.create({
      data: {
        userId,
        refreshTokenHash,
        familyId: familyId || crypto.randomUUID(),
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  static async authenticateWithGitHub(code: string, req: Request): Promise<AuthResult> {
    try {
      // 1. Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        },
        { headers: { Accept: 'application/json' } }
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        throw new Error('Failed to get access token from GitHub');
      }

      // 2. Fetch user profile
      const userResponse = await axios.get<GitHubUserResponse>('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const ghUser = userResponse.data;
      const { cipher, iv } = encryptToken(accessToken);

      // 3. Upsert User & OAuthIdentity
      const user = await adminPrisma.$transaction(async (tx) => {
        // Find existing user by githubLogin
        let u = await tx.user.findUnique({
          where: { githubLogin: ghUser.login.toLowerCase() }
        });

        if (!u) {
          // Check if there is an email user that already exists with the same email
          if (ghUser.email) {
            u = await tx.user.findFirst({
              where: { email: ghUser.email.toLowerCase() }
            });
          }
        }

        if (u) {
          u = await tx.user.update({
            where: { id: u.id },
            data: {
              githubLogin: ghUser.login.toLowerCase(),
              displayName: u.displayName || ghUser.name,
              avatarUrl: u.avatarUrl || ghUser.avatar_url,
              email: u.email || (ghUser.email ? ghUser.email.toLowerCase() : null),
            }
          });
        } else {
          u = await tx.user.create({
            data: {
              githubLogin: ghUser.login.toLowerCase(),
              handle: ghUser.login.toLowerCase(),
              displayName: ghUser.name,
              email: ghUser.email ? ghUser.email.toLowerCase() : null,
              avatarUrl: ghUser.avatar_url,
            }
          });
        }

        await tx.oAuthIdentity.upsert({
          where: {
            provider_providerUserId: {
              provider: 'github',
              providerUserId: String(ghUser.id),
            },
          },
          update: {
            accessTokenCipher: cipher,
            tokenIv: iv,
            scopes: ['repo', 'read:user', 'user:email'],
          },
          create: {
            userId: u.id,
            provider: 'github',
            providerUserId: String(ghUser.id),
            accessTokenCipher: cipher,
            tokenIv: iv,
            scopes: ['repo', 'read:user', 'user:email'],
          },
        });

        return u;
      });

      // 4. Issue access + refresh tokens
      const tokens = await this.createSession(user.id, req);

      return {
        ...tokens,
        user: {
          id: user.id,
          handle: user.handle,
          githubLogin: user.githubLogin,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      };
    } catch (error: any) {
      logger.error({ err: error.message }, 'GitHub authentication failed');
      throw new Error('Authentication failed');
    }
  }

  // Google OAuth — mirrors the GitHub flow. Users are matched by email, so a Google login with
  // the same address lands on the same account as GitHub/email sign-in.
  static async authenticateWithGoogle(
    code: string,
    redirectUri: string,
    req: Request,
  ): Promise<AuthResult> {
    try {
      // 1. Exchange the code for an access token (Google requires the exact redirect_uri used).
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID ?? '',
        client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });
      const tokenRes = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const accessToken = tokenRes.data.access_token as string | undefined;
      if (!accessToken) throw new Error('Failed to get access token from Google');

      // 2. Fetch the profile.
      const infoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const g = infoRes.data as { id: string; email?: string; name?: string; picture?: string };
      if (!g.email) throw new Error('Google account has no email');
      const email = g.email.toLowerCase();
      const { cipher, iv } = encryptToken(accessToken);

      // 3. Upsert User (by email) + OAuthIdentity.
      const user = await adminPrisma.$transaction(async (tx) => {
        let u = await tx.user.findFirst({ where: { email } });
        if (u) {
          u = await tx.user.update({
            where: { id: u.id },
            data: {
              displayName: u.displayName || g.name || null,
              avatarUrl: u.avatarUrl || g.picture || null,
            },
          });
        } else {
          const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
          let handle = prefix;
          let n = 0;
          while (await tx.user.findUnique({ where: { handle } })) {
            n += 1;
            handle = `${prefix}${n}`;
          }
          u = await tx.user.create({
            data: {
              email,
              handle,
              displayName: g.name ?? null,
              avatarUrl: g.picture ?? null,
              githubLogin: null,
            },
          });
        }

        await tx.oAuthIdentity.upsert({
          where: { provider_providerUserId: { provider: 'google', providerUserId: String(g.id) } },
          update: { accessTokenCipher: cipher, tokenIv: iv, scopes: ['openid', 'email', 'profile'] },
          create: {
            userId: u.id,
            provider: 'google',
            providerUserId: String(g.id),
            accessTokenCipher: cipher,
            tokenIv: iv,
            scopes: ['openid', 'email', 'profile'],
          },
        });
        return u;
      });

      const tokens = await this.createSession(user.id, req);
      return {
        ...tokens,
        user: {
          id: user.id,
          handle: user.handle,
          githubLogin: user.githubLogin,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      };
    } catch (error: any) {
      logger.error({ err: error.message }, 'Google authentication failed');
      throw new Error('Authentication failed');
    }
  }

  static async sendMagicLink(email: string): Promise<void> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error('Email is required');

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store verification token
      await adminPrisma.verificationToken.create({
        data: {
          email: cleanEmail,
          token,
          expiresAt,
        },
      });

      // Construct login callback link pointing to the Next.js frontend route
      const baseUrl = env.NODE_ENV === 'production' ? 'https://codevault.io' : 'http://localhost:3000';
      const loginUrl = `${baseUrl}/login/callback/email?token=${token}`;

      // Dispatch real email
      await MailerService.sendMagicLinkEmail(cleanEmail, loginUrl);
    } catch (error: any) {
      logger.error({ err: error.message, email }, 'Failed to generate magic link');
      throw new Error(error.message || 'Failed to generate login link');
    }
  }

  static async verifyMagicLink(token: string, req: Request): Promise<AuthResult> {
    try {
      if (!token) throw new Error('Token is required');

      // Find token
      const dbToken = await adminPrisma.verificationToken.findUnique({
        where: { token },
      });

      if (!dbToken) {
        throw new Error('Invalid or expired login link');
      }

      if (dbToken.expiresAt < new Date()) {
        await adminPrisma.verificationToken.delete({ where: { token } });
        throw new Error('Login link has expired');
      }

      const email = dbToken.email;

      // Find or create User
      let user = await adminPrisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Auto-generate a handle
        const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let handle = prefix || 'user';
        
        // Ensure uniqueness of handle
        let attempts = 0;
        while (attempts < 10) {
          const exists = await adminPrisma.user.findUnique({ where: { handle } });
          if (!exists) break;
          handle = `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`;
          attempts++;
        }

        user = await adminPrisma.user.create({
          data: {
            email: email.toLowerCase(),
            handle,
            githubLogin: null, // email sign-in users don't have githubLogin yet
            displayName: prefix,
          },
        });
      }

      // Issue access + refresh tokens
      const tokens = await this.createSession(user.id, req);

      // Clean up token
      await adminPrisma.verificationToken.delete({ where: { token } });

      return {
        ...tokens,
        user: {
          id: user.id,
          handle: user.handle,
          githubLogin: user.githubLogin,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      };
    } catch (error: any) {
      logger.error({ err: error.message }, 'Email link verification failed');
      throw new Error(error.message || 'Verification failed');
    }
  }

  /**
   * Rotate a refresh token: revoke old session, issue new tokens in the same family.
   * If the incoming token has already been revoked (replay attack), revoke the entire family.
   */
  static async refreshSession(
    oldRefreshToken: string,
    req: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const oldHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    const session = await adminPrisma.authSession.findUnique({
      where: { refreshTokenHash: oldHash },
    });

    if (!session) {
      throw new Error('Invalid refresh token');
    }

    // Reuse detection: token was already revoked → compromise detected
    if (session.revokedAt) {
      logger.warn({ familyId: session.familyId, userId: session.userId }, 'Refresh-token reuse detected — revoking family');
      await adminPrisma.authSession.updateMany({
        where: { familyId: session.familyId },
        data: { revokedAt: new Date() },
      });
      throw new Error('Refresh token reuse detected');
    }

    // Expired
    if (session.expiresAt < new Date()) {
      await adminPrisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw new Error('Refresh token expired');
    }

    // Revoke old session
    await adminPrisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens in the same family
    return this.createSession(session.userId, req, session.familyId);
  }

  /**
   * Explicitly revoke a session (logout).
   */
  static async revokeSession(refreshToken: string): Promise<void> {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const session = await adminPrisma.authSession.findUnique({
      where: { refreshTokenHash: hash },
    });

    if (session && !session.revokedAt) {
      await adminPrisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }
}
