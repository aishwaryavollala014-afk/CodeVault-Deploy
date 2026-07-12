import axios from 'axios';
import logger from '../../lib/logger';
import { redis } from '../../lib/redis';

export class HackerRankService {
  static async getStats(username: string) {
    try {
      // Fetch badges to get actual problem solved counts instead of ELO scores
      const badgesRes = await axios.get(
        `https://www.hackerrank.com/rest/hackers/${username}/badges`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );

      // Fetch recent submissions
      const recentRes = await axios.get(
        `https://www.hackerrank.com/rest/hackers/${username}/recent_challenges?limit=15`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ).catch(() => null);

      if (!badgesRes.data || !badgesRes.data.models) return null;

      const badges = badgesRes.data.models;
      let totalSolved = 0;
      const trackBreakdown: { name: string; score: number; rank: number }[] = [];

      badges.forEach((badge: any) => {
        const solved = badge.solved || 0;
        totalSolved += solved;
        
        if (solved > 0) {
          trackBreakdown.push({
            name: badge.badge_name || badge.badge_type,
            score: solved, // Use solved count as the "score" for the breakdown
            rank: badge.hacker_rank || 0
          });
        }
      });

      // Sort by solved count descending
      trackBreakdown.sort((a, b) => b.score - a.score);

      const recent: any[] = [];
      if (recentRes?.data?.models) {
        recentRes.data.models.forEach((sub: any) => {
          recent.push({
            title: sub.name,
            titleSlug: sub.ch_slug,
            timestamp: Math.floor(new Date(sub.created_at).getTime() / 1000)
          });
        });
      }

      // Fetch tags for each problem concurrently
      await Promise.all(recent.map(async (sub) => {
        const cacheKey = `tag_cache:hackerrank:${sub.titleSlug}`;
        let tags: string[] | null = null;

        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            tags = JSON.parse(cached);
          }
        } catch (redisErr) {
          // Ignore redis error
        }

        if (!tags) {
          try {
            const probRes = await axios.get(`https://www.hackerrank.com/rest/contests/master/challenges/${sub.titleSlug}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              timeout: 3000
            });
            const model = probRes.data?.model;
            tags = [];
            if (model) {
              if (model.track && model.track.name) tags.push(model.track.name);
              if (Array.isArray(model.topics)) {
                for (const t of model.topics) {
                  if (t && t.name) tags.push(t.name);
                }
              }
            }
            tags = Array.from(new Set(tags.filter(t => typeof t === 'string' && t.trim() !== '')));
            
            try {
              await redis.setex(cacheKey, 86400 * 7, JSON.stringify(tags));
            } catch (redisErr) {
              // Ignore redis error
            }
          } catch (err) {
            tags = [];
          }
        }

        sub.tags = tags || [];
      }));

      const topics: Record<string, number> = {};
      const heatmap: Record<string, number> = {};
      recent.forEach((sub) => {
        if (Array.isArray(sub.tags)) {
          sub.tags.forEach((tag: string) => {
            const lowerTag = tag.toLowerCase();
            topics[lowerTag] = (topics[lowerTag] || 0) + 1;
          });
        }
        if (sub.timestamp) {
          const d = new Date(sub.timestamp * 1000);
          d.setUTCHours(0, 0, 0, 0);
          const ts = Math.floor(d.getTime() / 1000).toString();
          heatmap[ts] = (heatmap[ts] || 0) + 1;
        }
      });

      return {
        total: totalSolved,
        tracks: trackBreakdown,
        recent,
        topics,
        heatmap
      };
    } catch (error) {
      logger.error({ username }, 'Failed to fetch HackerRank stats');
      return null;
    }
  }
}
