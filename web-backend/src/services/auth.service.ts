import axios from 'axios';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import { encryptToken } from '../lib/crypto';
import { MailerService } from './mailer.service';

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface AuthResult {
  token: string;
  user: {
    id: string;
    handle: string;
    githubLogin: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export class AuthService {
  static async authenticateWithGitHub(code: string): Promise<AuthResult> {
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
      const user = await prisma.$transaction(async (tx) => {
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

      // 4. Issue JWT
      const jwtToken = signToken({ userId: user.id });

      return {
        token: jwtToken,
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

  static async sendMagicLink(email: string): Promise<void> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new Error('Email is required');

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store verification token
      await prisma.verificationToken.create({
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

  static async verifyMagicLink(token: string): Promise<AuthResult> {
    try {
      if (!token) throw new Error('Token is required');

      // Find token
      const dbToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!dbToken) {
        throw new Error('Invalid or expired login link');
      }

      if (dbToken.expiresAt < new Date()) {
        await prisma.verificationToken.delete({ where: { token } });
        throw new Error('Login link has expired');
      }

      const email = dbToken.email;

      // Find or create User
      let user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Auto-generate a handle
        const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let handle = prefix || 'user';
        
        // Ensure uniqueness of handle
        let attempts = 0;
        while (attempts < 10) {
          const exists = await prisma.user.findUnique({ where: { handle } });
          if (!exists) break;
          handle = `${prefix}_${Math.floor(1000 + Math.random() * 9000)}`;
          attempts++;
        }

        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            handle,
            githubLogin: null, // email sign-in users don't have githubLogin yet
            displayName: prefix,
          },
        });
      }

      // Issue JWT
      const jwtToken = signToken({ userId: user.id });

      // Clean up token
      await prisma.verificationToken.delete({ where: { token } });

      return {
        token: jwtToken,
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
}
