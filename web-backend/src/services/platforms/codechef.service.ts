import axios from 'axios';
import logger from '../../lib/logger';

// CodeChef exposes no public API, so we scrape the public profile page
// (https://www.codechef.com/users/<username>). The page embeds:
//   - "Total Problems Solved: N"        -> problems solved
//   - <div class="rating-number">NNNN   -> current rating (first occurrence)
//   - "Highest Rating NNNN"             -> peak rating
//   - "var all_rating = [ ... ]"        -> full contest rating history (JSON)
// Star rating is derived from the current rating band.
export class CodeChefService {
  static async getStats(username: string) {
    try {
      const res = await axios.get(`https://www.codechef.com/users/${username}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000,
      });

      const html: string = typeof res.data === 'string' ? res.data : '';

      // CodeChef returns 200 even for non-existent usernames (generic page).
      // A valid profile page has a title like "username | CodeChef User Profile".
      const titleMatch = html.match(/<title>[^|]*\|\s*CodeChef User Profile/i);
      if (!titleMatch) {
        logger.warn({ username }, 'CodeChef profile page not found (username may be invalid)');
        return null;
      }

      // Problems solved — "Total Problems Solved: 632" (allow tags/whitespace between).
      const totalMatch = html.match(/Total Problems Solved[^0-9]{0,20}(\d+)/i);
      const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

      // Current rating — first numeric .rating-number div (second one can be "NA").
      const ratingMatch = html.match(/class="rating-number"\s*>\s*(\d+)/);
      const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;

      // Peak rating.
      const highestMatch = html.match(/Highest Rating[^0-9]{0,10}(\d+)/i);
      const highestRating = highestMatch ? parseInt(highestMatch[1], 10) : null;

      // Global rank (first occurrence).
      const rankMatch = html.match(/global rank[^0-9]{0,10}(\d+)/i);
      const globalRank = rankMatch ? parseInt(rankMatch[1], 10) : null;

      // Fetch recent submissions
      let recent: any[] = [];
      try {
        const recentRes = await axios.get(`https://www.codechef.com/recent/user?page=0&user_handle=${username}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 5000,
        });
        const content = recentRes.data?.content;
        if (content && typeof content === 'string') {
          const rows = content.split('<tr >').slice(1);
          rows.forEach((row) => {
            const isAccepted = row.includes("title='accepted'") || row.includes('tick-icon.gif');
            if (isAccepted) {
              const timeMatch = row.match(/<td\s+title='([^']+)'/);
              const probMatch = row.match(/<a href='[^']+'[^>]*>([^<]+)<\/a>/);
              if (timeMatch && probMatch) {
                // timeMatch[1] format: "11:08 PM 24/05/15" (dd/mm/yy)
                let timestamp = Math.floor(Date.now() / 1000); // fallback
                try {
                  const parts = timeMatch[1].split(' ');
                  if (parts.length >= 3) {
                    const dateParts = parts[2].split('/');
                    if (dateParts.length === 3) {
                      const dateStr = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${parts[0]} ${parts[1]}`;
                      const d = new Date(dateStr);
                      if (!isNaN(d.getTime())) {
                        timestamp = Math.floor(d.getTime() / 1000);
                      }
                    }
                  }
                } catch (e) {}

                recent.push({
                  title: probMatch[1],
                  titleSlug: probMatch[1],
                  timestamp
                });
              }
            }
          });
          // Limit to 15
          recent = recent.slice(0, 15);
        }
      } catch (e) {
        logger.warn({ username }, 'Failed to fetch CodeChef recent submissions');
      }

      return {
        total,
        rating,
        highestRating,
        stars: rating ? CodeChefService.starsFromRating(rating) : null,
        globalRank,
        recent,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn({ username }, 'CodeChef user not found');
      } else {
        logger.error({ username, err: error.message }, 'Failed to fetch CodeChef stats');
      }
      return null;
    }
  }

  // CodeChef star bands (by current rating).
  private static starsFromRating(rating: number): number {
    if (rating >= 2500) return 7;
    if (rating >= 2200) return 6;
    if (rating >= 2000) return 5;
    if (rating >= 1800) return 4;
    if (rating >= 1600) return 3;
    if (rating >= 1400) return 2;
    return 1;
  }
}
