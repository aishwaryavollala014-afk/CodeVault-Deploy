import prisma from '../lib/prisma';
import { StatsService } from './stats.service';
import logger from '../lib/logger';
import { redis } from '../lib/redis';

export class PublicService {
  static async getPublicProfile(handle: string) {
    const cacheKey = `public:${handle}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      logger.warn('Redis cache read failed for public profile');
    }

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
    
    const profile = {
      user: {
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

    return profile;
  }
}
