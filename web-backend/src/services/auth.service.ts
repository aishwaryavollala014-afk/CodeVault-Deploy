import axios from 'axios';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import crypto from 'crypto';

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
    githubLogin: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export class AuthService {
  private static encryptToken(token: string): { cipher: Buffer; iv: Buffer } {
    const key = Buffer.from(env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(token, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final(), cipher.getAuthTag()]);
    return { cipher: encrypted, iv };
  }

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
      const { cipher, iv } = this.encryptToken(accessToken);

      // 3. Upsert User & OAuthIdentity
      const user = await prisma.$transaction(async (tx) => {
        const u = await tx.user.upsert({
          where: { githubLogin: ghUser.login.toLowerCase() },
          update: {
            displayName: ghUser.name,
            avatarUrl: ghUser.avatar_url,
          },
          create: {
            githubLogin: ghUser.login.toLowerCase(),
            handle: ghUser.login.toLowerCase(),
            displayName: ghUser.name,
            email: ghUser.email,
            avatarUrl: ghUser.avatar_url,
          },
        });

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
          },
          create: {
            userId: u.id,
            provider: 'github',
            providerUserId: String(ghUser.id),
            accessTokenCipher: cipher,
            tokenIv: iv,
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
}
