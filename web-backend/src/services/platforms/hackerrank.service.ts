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

      return {
        total: totalSolved,
        tracks: trackBreakdown
      };
    } catch (error) {
      logger.error({ username }, 'Failed to fetch HackerRank stats');
      return null;
    }
  }
}
