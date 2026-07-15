import prisma from '../lib/prisma';
import { StatsService } from './stats.service';
import { FollowService } from './follow.service';
import logger from '../lib/logger';
import { redis } from '../lib/redis';

export class PublicService {
  static async getPublicProfile(handle: string, viewerId?: string) {
    const cacheKey = `public:${handle}`;

    // The cached part is viewer-independent. Follow stats (counts + isFollowing)
    // are appended fresh on every request: counts change often and isFollowing
    // is per-viewer, so neither may live inside the shared cache entry.
    let profile: any | null = null;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) profile = JSON.parse(cached);
    } catch (err) {
      logger.warn('Redis cache read failed for public profile');
    }

    let userId: string | undefined = profile?.user?.id;

    if (!profile || !userId) {
      const user = await prisma.user.findUnique({
        where: { handle },
        select: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
          publicProfileEnabled: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.publicProfileEnabled) {
        throw new Error('This profile is private');
      }

      const stats = await StatsService.getAggregatedStats(user.id);

      userId = user.id;
      profile = {
        user: {
          id: user.id,
          handle: user.handle,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        stats
      };

      try {
        await redis.setex(cacheKey, 900, JSON.stringify(profile)); // Cache for 15 mins
      } catch (err) {
        logger.warn('Redis cache write failed for public profile');
      }
    }

    const social = await FollowService.getFollowStats(userId!, viewerId);

    return {
      ...profile,
      social: { ...social, isSelf: viewerId === userId },
    };
  }
}
