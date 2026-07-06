import axios from 'axios';
import logger from '../../lib/logger';

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

      return {
        total: totalSolved,
        tracks: trackBreakdown,
        recent
      };
    } catch (error) {
      logger.error({ username }, 'Failed to fetch HackerRank stats');
      return null;
    }
  }
}
