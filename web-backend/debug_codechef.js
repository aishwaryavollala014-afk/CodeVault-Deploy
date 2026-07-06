const axios = require('axios');

async function findCorrectUsername() {
  // Try different username variations
  const variations = [
    'aishwaryav00706',
    'aishwaryav007',
    'aishwaryav0706',
    'aishwaryav706',
    'aishwarya_v00706',
    'aishwaryav',
    'gaurav06120714',   // GitHub username as fallback
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  for (const username of variations) {
    try {
      const res = await axios.get(`https://www.codechef.com/users/${username}`, { headers, timeout: 10000 });
      const html = res.data;
      const title = html.match(/<title>(.*?)<\/title>/i);
      const solved = html.match(/Total Problems Solved[^0-9]{0,20}(\d+)/i);
      
      if (title && title[1].includes('User Profile')) {
        console.log(`✅ ${username} → FOUND! Title: ${title[1]}, Solved: ${solved ? solved[1] : '?'}`);
      } else {
        console.log(`❌ ${username} → page loaded but no profile (title: ${title ? title[1] : 'none'})`);
      }
    } catch (e) {
      console.log(`❌ ${username} → ${e.response?.status || e.message}`);
    }
  }
}

findCorrectUsername();
