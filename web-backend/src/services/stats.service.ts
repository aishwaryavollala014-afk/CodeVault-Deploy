import { ConnectionService } from './connection.service';
import { LeetCodeService } from './platforms/leetcode';
import { CodeforcesService } from './platforms/codeforces';
import { CodeChefService } from './platforms/codechef.service';
import { HackerRankService } from './platforms/hackerrank.service';
import { redis } from '../lib/redis';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';

// ── Cache TTLs ────────────────────────────────────────────────────────────────
// Aggregating 4 platforms simultaneously (LeetCode GraphQL, Codeforces API,
// CodeChef HTML scrape, HackerRank REST) can trigger IP bans / rate limits if
// refreshed too aggressively. 20 minutes (1200 s) sits comfortably in the
// recommended 15–30 min window while still feeling reasonably fresh.
const STATS_TTL_MS  = 1200_000; // 20 min (in-memory)
const STATS_TTL_SEC = 1200;     // 20 min (Redis)

// In-memory L1 cache — survives within a single process restart cycle only.
// Avoids a Redis round-trip for the most common "same user, same minute" case.
const memoryCache = new Map<string, { data: any; expires: number }>();

/** Fetch per-platform stats, checking the individual Redis cache first. */
async function fetchPlatformStats(
  platform: PlatformType,
  username: string,
  userId: string,
): Promise<any> {
  const platformKey = `stats:platform:${userId}:${platform}`;

  // L2 — individual platform Redis cache
  try {
    const cached = await redis.get(platformKey);
    if (cached) {
      logger.debug(`[StatsService] Platform cache HIT: ${platform}:${username}`);
      return JSON.parse(cached);
    }
  } catch {
    // Redis unavailable — fall through to live fetch
  }

  let stats: any = null;
  if (platform === PlatformType.leetcode) {
    stats = await LeetCodeService.getStats(username);
  } else if (platform === PlatformType.codeforces) {
    stats = await CodeforcesService.getStats(username);
  } else if (platform === PlatformType.codechef) {
    stats = await CodeChefService.getStats(username);
  } else if (platform === PlatformType.hackerrank) {
    stats = await HackerRankService.getStats(username);
  }

  if (stats) {
    // Write per-platform result to Redis; a single failed platform won't bust
    // the entire aggregate cache on the next request.
    try {
      await redis.setex(platformKey, STATS_TTL_SEC, JSON.stringify(stats));
    } catch {
      // Redis write failure is non-fatal
    }
  }

  return stats;
}

export class StatsService {
  static async getAggregatedStats(userId: string) {
    const startTime = Date.now();
    const cacheKey = `stats:${userId}`;

    // L1 — in-memory cache (fastest path, within a single process lifetime)
    const mem = memoryCache.get(cacheKey);
    if (mem && mem.expires > Date.now()) {
      logger.debug(`[StatsService] Memory cache HIT for ${userId} (${Date.now() - startTime}ms)`);
      return mem.data;
    }

    // L2 — aggregate Redis cache (shared across process restarts / replicas)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Repopulate L1 so the next request within this process is instant
        memoryCache.set(cacheKey, { data, expires: Date.now() + STATS_TTL_MS });
        logger.debug(`[StatsService] Redis aggregate cache HIT for ${userId}`);
        return data;
      }
    } catch (err) {
      logger.warn('[StatsService] Redis aggregate cache read failed — proceeding with live fetch');
    }

    // L3 — live fetch from all connected platforms (concurrently, per-platform cached)
    const connections = await ConnectionService.listConnections(userId);

    const aggregated = {
      totalSolved: 0,
      platforms: {} as Record<string, any>,
    };

    await Promise.all(
      connections.map(async (conn) => {
        const stats = await fetchPlatformStats(conn.platform, conn.username, userId);
        if (stats) {
          aggregated.platforms[conn.platform] = stats;
        }
      }),
    );

    // Recalculate totals once all platforms resolve
    for (const p of Object.values(aggregated.platforms)) {
      aggregated.totalSolved += (p as any).total || 0;
    }

    // Write to L1 and L2 caches
    memoryCache.set(cacheKey, { data: aggregated, expires: Date.now() + STATS_TTL_MS });

    try {
      await redis.setex(cacheKey, STATS_TTL_SEC, JSON.stringify(aggregated));
    } catch (err) {
      logger.warn('[StatsService] Redis aggregate cache write failed');
    }

    logger.info(`[StatsService] Live fetch complete for ${userId} in ${Date.now() - startTime}ms`);
    return aggregated;
  }
}
