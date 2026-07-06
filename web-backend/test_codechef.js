const axios = require('axios');

async function test() {
  const username = 'aishwaryav00706';
  
  // These are documented working endpoints that CodeChef uses internally
  const endpoints = [
    // User rating history (used by the rating chart on profile)
    `https://www.codechef.com/api/ratings/${username}`,
    // User submissions
    `https://www.codechef.com/recent/user?page=0&user_handle=${username}`,
    // Practice problems list with user filter  
    `https://www.codechef.com/api/list/problems/practice?sort_by=difficulty_rating&sort_order=asc&solved_by=${username}&limit=1`,
    // User details used by the profile SPA
    `https://www.codechef.com/api/user-details?username=${username}`,
    // Alternative format
    `https://www.codechef.com/api/user-profile/${username}`,
  ];
  
  for (const url of endpoints) {
    console.log(`\n=== ${url.substring(0,80)} ===`);
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/html, */*',
          'x-requested-with': 'XMLHttpRequest',
          'Referer': 'https://www.codechef.com/',
        },
        timeout: 10000,
      });
      const data = res.data;
      if (typeof data === 'object') {
        console.log('Keys:', Object.keys(data));
        console.log('Preview:', JSON.stringify(data).substring(0, 600));
      } else {
        console.log('Type:', typeof data, 'Length:', String(data).length);
        // Check if it's HTML with user data
        if (typeof data === 'string' && data.includes(username)) {
          console.log('Contains username!');
          const solvedMatch = data.match(/(\d+)\s*(?:problems?|fully)\s*solved/i);
          if (solvedMatch) console.log('Solved:', solvedMatch[0]);
        }
      }
    } catch (e) {
      console.log('ERROR:', e.response?.status);
    }
  }
}

test();
