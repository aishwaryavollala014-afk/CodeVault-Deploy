import axios from 'axios';
import logger from '../../lib/logger';

export class CodeChefService {
  static async getStats(username: string) {
    try {
      // CodeChef has no public API — we scrape the profile page HTML
      const res = await axios.get(`https://www.codechef.com/users/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const html = res.data;

      // Try to extract the JSON data embedded in the page
      // CodeChef embeds user data in a script tag
      const totalMatch = html.match(/fully\s*solved.*?(\d+)/i) || html.match(/problems\s*solved.*?(\d+)/i);
      
      // Try rating
      const ratingMatch = html.match(/rating.*?(\d{3,4})/i);
      
      // Try stars
      const starsMatch = html.match(/(\d)\s*star/i);
      
      let total = 0;
      if (totalMatch) {
        total = parseInt(totalMatch[1]);
      }

      // If we can't scrape, return a minimal result
      return {
        total: total || 0,
        rating: ratingMatch ? parseInt(ratingMatch[1]) : null,
        stars: starsMatch ? parseInt(starsMatch[1]) : null
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn({ username }, 'CodeChef user not found');
      } else {
        logger.error({ username }, 'Failed to fetch CodeChef stats');
      }
      return null;
    }
  }
}
