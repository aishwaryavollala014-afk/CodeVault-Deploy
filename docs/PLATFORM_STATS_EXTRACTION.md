# 📊 Platform Stats Extraction — How It Works

> This document explains **exactly** how CodeVault fetches stats from each competitive-programming platform. No secrets, no tokens — just public data.

---

## Overview

CodeVault fetches stats from **4 platforms** using only the user's **public username**. Every platform exposes profile statistics publicly (the same data anyone can see by visiting a user's profile page). CodeVault simply automates this — instead of visiting 4 websites manually, it fetches everything and shows it in one dashboard.

```
User enters username → CodeVault calls public API/page → Parses response → Shows on dashboard
```

### Key Principle

| What | Auth Needed? | Method |
|------|-------------|--------|
| **Stats** (problems solved, ratings, heatmap) | ❌ No — username only | Public APIs / page scraping |
| **Source code** (actual submitted solutions) | ✅ Yes — authorized session | Browser extension / OAuth (Path B) |

**This document covers Stats (Path A) only.** Source code sync (Path B) is documented in [EXTENSION_PLAN.md](EXTENSION_PLAN.md).

---

## 1. LeetCode

**Source file:** [`web-backend/src/services/platforms/leetcode.ts`](../web-backend/src/services/platforms/leetcode.ts)

### How it works

LeetCode has a **public GraphQL API** at `https://leetcode.com/graphql`. No API key, no login, no rate-limit token required. This is the same API that powers the public profile page (`leetcode.com/u/<username>`).

### API call

```
POST https://leetcode.com/graphql
Content-Type: application/json

{
  "query": "query getUserProfile($username: String!) { ... }",
  "variables": { "username": "<username>" }
}
```

### GraphQL query used

```graphql
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    submitStats: submitStatsGlobal {
      acSubmissionNum { difficulty count }
    }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
  matchedUserCalendar: matchedUser(username: $username) {
    userCalendar { submissionCalendar }
  }
  recentAcSubmissionList(username: $username, limit: 15) {
    title
    titleSlug
    timestamp
  }
}
```

### Data extracted

| Field | Description | Example |
|-------|-------------|---------|
| `easy` | Easy problems solved | `46` |
| `medium` | Medium problems solved | `28` |
| `hard` | Hard problems solved | `1` |
| `total` | Total problems solved | `75` |
| `languages` | Languages used with count | `[{ "languageName": "Python3", "problemsSolved": 50 }, ...]` |
| `topics` | Topic tags with count | `{ "fundamental": [...], "intermediate": [...], "advanced": [...] }` |
| `heatmap` | Submission calendar (Unix timestamps → count) | `{ "1719792000": 3, "1719878400": 1, ... }` |
| `recent` | Last 15 accepted submissions | `[{ "title": "Two Sum", "timestamp": "1719792000" }, ...]` |

### Authentication

**None.** The GraphQL endpoint is publicly accessible. You can test it yourself:

```bash
curl -X POST https://leetcode.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ matchedUser(username: \"neal_wu\") { submitStats: submitStatsGlobal { acSubmissionNum { difficulty count } } } }"}'
```

---

## 2. Codeforces

**Source file:** [`web-backend/src/services/platforms/codeforces.ts`](../web-backend/src/services/platforms/codeforces.ts)

### How it works

Codeforces has an **official public REST API** documented at [codeforces.com/apiHelp](https://codeforces.com/apiHelp). No API key needed for read-only endpoints.

### API calls

Two separate API calls are made:

```
GET https://codeforces.com/api/user.status?handle=<username>
GET https://codeforces.com/api/user.rating?handle=<username>
```

### Data extracted

The `user.status` endpoint returns **all submissions** ever made by the user. CodeVault processes them in memory:

| Field | How it's calculated | Example |
|-------|-------------------|---------|
| `total` | Count of unique problems with verdict `OK` | `13` |
| `languages` | Count of solved problems per programming language | `{ "GNU C++17": 8, "Python 3": 5 }` |
| `topics` | Count of solved problems per problem tag | `{ "implementation": 6, "math": 4, "dp": 2 }` |
| `heatmap` | Submission timestamps grouped for activity heatmap | `{ "1719792000": 1, ... }` |
| `recent` | First 15 unique accepted submissions (newest first) | `[{ "title": "1A - Theatre Square", "rating": 1000 }, ...]` |
| `ratingHistory` | Full contest rating history | `[{ "contestId": 1, "newRating": 1500 }, ...]` |

### Processing logic

```
For each submission where verdict === "OK":
  1. Build a unique problem ID: "{contestId}-{problemIndex}" (e.g., "1922-A")
  2. If not already seen → count it as solved, record language & tags
  3. Add to heatmap data
  4. Keep first 15 for recent submissions
```

### Authentication

**None.** The Codeforces API is fully public. Test it yourself:

```bash
curl "https://codeforces.com/api/user.status?handle=tourist&from=1&count=5"
```

---

## 3. CodeChef

**Source file:** [`web-backend/src/services/platforms/codechef.service.ts`](../web-backend/src/services/platforms/codechef.service.ts)

### How it works

CodeChef does **not** have a public API. Instead, CodeVault **scrapes the public profile page** at `https://www.codechef.com/users/<username>`. This is the same page anyone sees when they visit a CodeChef profile.

### HTTP request

```
GET https://www.codechef.com/users/<username>
User-Agent: Mozilla/5.0 (standard browser user agent)
```

### Data extracted (via regex on HTML)

| Field | Regex pattern | Example |
|-------|--------------|---------|
| `total` | `Total Problems Solved: <number>` | `4` |
| `rating` | `<div class="rating-number">NNNN` | `1423` |
| `highestRating` | `Highest Rating NNNN` | `1512` |
| `globalRank` | `global rank <number>` | `52341` |
| `stars` | Derived from rating using CodeChef's band system | `2` |

### Star rating bands

Stars are calculated from the current rating:

| Rating | Stars |
|--------|-------|
| < 1400 | ★ (1 star) |
| 1400–1599 | ★★ (2 star) |
| 1600–1799 | ★★★ (3 star) |
| 1800–1999 | ★★★★ (4 star) |
| 2000–2199 | ★★★★★ (5 star) |
| 2200–2499 | ★★★★★★ (6 star) |
| ≥ 2500 | ★★★★★★★ (7 star) |

### Invalid username detection

CodeChef returns HTTP 200 even for non-existent usernames (it shows a generic page). CodeVault detects valid profiles by checking for the page title pattern:

```
<title>username | CodeChef User Profile for Full Name | CodeChef</title>
```

If this pattern is missing → the username is invalid → returns `null`.

### Authentication

**None.** The profile page is publicly accessible. Test it yourself:

```bash
curl "https://www.codechef.com/users/admin"
```

### ⚠️ Important notes

- CodeChef may change their HTML structure at any time (since this is scraping, not an official API). If stats stop working, the regex patterns in `codechef.service.ts` may need updating.
- The scraper uses a standard browser `User-Agent` header to avoid being blocked.

---

## 4. HackerRank

**Source file:** [`web-backend/src/services/platforms/hackerrank.service.ts`](../web-backend/src/services/platforms/hackerrank.service.ts)

### How it works

HackerRank has a **public REST API** that powers its profile pages. The badges endpoint returns per-track solved counts.

### API call

```
GET https://www.hackerrank.com/rest/hackers/<username>/badges
User-Agent: Mozilla/5.0
```

### Response structure

```json
{
  "models": [
    {
      "badge_name": "Problem Solving",
      "badge_type": "problem_solving",
      "stars": 3,
      "solved": 42,
      "hacker_rank": 12345
    },
    {
      "badge_name": "Python",
      "badge_type": "python",
      "stars": 5,
      "solved": 16,
      "hacker_rank": 5678
    }
  ]
}
```

### Data extracted

| Field | How it's calculated | Example |
|-------|-------------------|---------|
| `total` | Sum of `solved` across all badge tracks | `58` |
| `tracks` | Per-track breakdown (name, solved count, rank) | `[{ "name": "Problem Solving", "score": 42, "rank": 12345 }, ...]` |

### Authentication

**None.** The badges API is publicly accessible. Test it yourself:

```bash
curl "https://www.hackerrank.com/rest/hackers/HackerRank/badges"
```

---

## Complete Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│   User       │     │   Web Frontend   │     │   Web Backend     │     │  Platforms   │
│  (Browser)   │     │   (Next.js)      │     │   (Express)       │     │  (Public)    │
└──────┬───────┘     └────────┬─────────┘     └────────┬──────────┘     └──────┬───────┘
       │                      │                        │                       │
       │  1. Login via GitHub │                        │                       │
       │─────────────────────>│                        │                       │
       │                      │                        │                       │
       │  2. Enter platform   │                        │                       │
       │     usernames        │                        │                       │
       │─────────────────────>│  3. Save to DB         │                       │
       │                      │───────────────────────>│                       │
       │                      │                        │                       │
       │  4. Open dashboard   │                        │                       │
       │─────────────────────>│  5. GET /api/stats     │                       │
       │                      │───────────────────────>│                       │
       │                      │                        │  6. For each platform:│
       │                      │                        │     fetch public data │
       │                      │                        │──────────────────────>│
       │                      │                        │                       │
       │                      │                        │  7. Response (JSON/   │
       │                      │                        │     HTML)             │
       │                      │                        │<──────────────────────│
       │                      │                        │                       │
       │                      │  8. Aggregated stats   │                       │
       │                      │<───────────────────────│                       │
       │                      │                        │                       │
       │  9. Render dashboard │                        │                       │
       │<─────────────────────│                        │                       │
       │                      │                        │                       │
```

### Caching

Stats are cached in **Redis** for 10 minutes (key: `stats:<userId>`). This means:
- First load: fetches from all platforms (may take 2-5 seconds)
- Subsequent loads within 10 min: instant from cache
- After 10 min: re-fetches fresh data

---

## Summary Table

| Platform | Data Source | Method | Auth | Reliability |
|----------|-----------|--------|------|-------------|
| LeetCode | `leetcode.com/graphql` | GraphQL POST | None | ★★★★★ (official API) |
| Codeforces | `codeforces.com/api/` | REST GET | None | ★★★★★ (official API) |
| CodeChef | `codechef.com/users/` | HTML scraping | None | ★★★☆☆ (may break if HTML changes) |
| HackerRank | `hackerrank.com/rest/` | REST GET | None | ★★★★☆ (undocumented but stable) |

---

## FAQ

**Q: Can I see someone else's stats if I know their username?**
A: Yes — but only through your own CodeVault account. You connect a platform username to your account, and CodeVault fetches that profile's public stats. This is the same data anyone can see by visiting the profile page directly.

**Q: What if a platform changes their API or page structure?**
A: LeetCode and Codeforces have stable APIs and are unlikely to break. CodeChef uses HTML scraping, so if they redesign their profile page, the regex patterns in `codechef.service.ts` would need updating. HackerRank's REST API is undocumented but has been stable for years.

**Q: Why can't you get source code with just a username?**
A: Source code is **private** on most platforms. LeetCode and Codeforces don't expose submitted code through their public APIs. Getting source code requires either: (1) the user's authenticated session, or (2) our browser extension that captures code at solve-time. This is handled by the git-service (Path B), not the stats system.

**Q: Is there any rate limiting?**
A: Yes, all platforms have some form of rate limiting. CodeVault mitigates this by caching stats in Redis for 10 minutes. For normal usage (a few users refreshing their dashboards), rate limits are never hit.
