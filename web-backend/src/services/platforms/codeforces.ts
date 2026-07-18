import axios from 'axios';
import logger from '../../lib/logger';
import { redis } from '../../lib/redis';

export class CodeforcesService {
  static async getStats(username: string) {
    // Individual problem-tag cache (long-lived — CF tags don't change)
    const TAG_TTL_SEC = 86400 * 7; // 7 days

    try {
      // Run both requests concurrently — rating history is non-critical
      const [statusRes, ratingRes] = await Promise.all([
        axios.get(`https://codeforces.com/api/user.status?handle=${username}`),
        axios
          .get(`https://codeforces.com/api/user.rating?handle=${username}`)
          .catch(() => null),
      ]);

      if (statusRes.data.status !== 'OK') return null;

      const submissions = statusRes.data.result as any[];
      const ratingHistory =
        ratingRes?.data?.status === 'OK' ? ratingRes.data.result : [];

      const solved = new Set<string>();
      const heatmap: Record<string, number> = {};
      const languages: Record<string, number> = {};
      const topics: Record<string, number> = {};
      const recent: any[] = [];

      for (const sub of submissions) {
        if (sub.verdict !== 'OK') continue;
        const probId = `${sub.problem.contestId}-${sub.problem.index}`;

        if (!solved.has(probId)) {
          solved.add(probId);

          const lang = sub.programmingLanguage as string;
          languages[lang] = (languages[lang] || 0) + 1;

          const tags: string[] = sub.problem.tags || [];
          for (const tag of tags) {
            topics[tag] = (topics[tag] || 0) + 1;
          }

          // Try to enrich tags from Redis tag cache (populated by prior requests)
          if (recent.length < 15) {
            const tagCacheKey = `tag_cache:codeforces:${probId}`;
            let cachedTags: string[] | null = null;
            try {
              const raw = await redis.get(tagCacheKey);
              cachedTags = raw ? (JSON.parse(raw) as string[]) : null;
            } catch { /* ignore */ }

            // Store the CF-provided tags in the cache if not already present
            if (!cachedTags && tags.length > 0) {
              try {
                await redis.setex(tagCacheKey, TAG_TTL_SEC, JSON.stringify(tags));
              } catch { /* ignore */ }
            }

            recent.push({
              title: `${sub.problem.contestId}${sub.problem.index} - ${sub.problem.name}`,
              titleSlug: probId,
              timestamp: sub.creationTimeSeconds as number,
              rating: sub.problem.rating,
              tags: cachedTags || tags,
            });
          }
        }

        const ts = sub.creationTimeSeconds as number;
        heatmap[ts.toString()] = (heatmap[ts.toString()] || 0) + 1;
      }

      return {
        total: solved.size,
        heatmap,
        languages,
        topics,
        recent,
        ratingHistory,
      };
    } catch (error) {
      logger.error({ username }, 'Failed to fetch Codeforces stats');
      return null;
    }
  }
}
