# 🔌 CodeVault — Platform Integration Specification

> Principal Architect specification. **No implementation code.** The technical heart of CodeVault: how we integrate with LeetCode, Codeforces, CodeChef, and HackerRank — both for public stats (Path A) and authorized code sync (Path B). Companion to [BACKEND_PLAN §5-6](BACKEND_PLAN.md), [SECURITY_PLAN §7-8](SECURITY_PLAN.md), [DATABASE_PLAN §14](DATABASE_PLAN.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 0. Two Integration Paths (applies to all platforms)

```
Path A — Public stats (username only, no login)
  web-backend ──username──▶ platform public API/page ──▶ stats aggregate ──▶ dashboard

Path B — Code sync (one-time authorized session)
  User authorizes ──session token──▶ encrypted in DB
  git-service worker ──decrypt token──▶ platform authed API ──▶ accepted submissions + source + question
                                     ──▶ GitHub push (folder per problem) ──▶ DB update

Path B v2 — Code sync (browser extension, preferred)
  User signed in to platform in own browser
  content script ──detect Accepted──▶ capture number/slug/code/question (intercept platform response; DOM fallback)
  background SW ──user JWT──▶ git-service POST /api/ingest ──▶ same GitHub push (folder per problem) ──▶ DB update
```

Path A and Path B are **independent failure domains** — if Path B's session expires, Path A (the dashboard) keeps working.

> 🧩 **Path B v2 (extension)** is the **preferred** code-sync source: it captures the user's own accepted code in their own authenticated browser, so there is **no server-side session token to store or replay**. The per-platform "Path B — Code sync" subsections below describe the server-side approach; for B v2 the **same captured fields** (number, slug, title, difficulty, tags, language, source, question) are read client-side and posted to `POST /api/ingest`, which runs the identical GitHub push. See [EXTENSION_PLAN.md](EXTENSION_PLAN.md) §4 and [browser-extension/README.md](../browser-extension/README.md). Per-platform capture signal: **LeetCode** submission-check GraphQL response · **Codeforces** verdict poll · **CodeChef / HackerRank** submission-result DOM/network.

---

## 1. LeetCode

### 1.1 Integration overview

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Stats (solved count, difficulty, topics, streaks) + code sync |
| **Official API?** | ❌ No public REST API. Uses an **internal GraphQL API** (`leetcode.com/graphql`) — this is what the LeetCode web app calls. Not officially documented for third parties. |
| **Path A auth** | None — public stats queries by username are unauthenticated |
| **Path B auth** | **Session cookie** (`LEETCODE_SESSION` + `csrftoken`) from a logged-in browser session. This is the one-time connect. |
| **Data availability** | Public: solved count by difficulty, topic tags, badges, streak, contest rating. Private (auth): full submission list with source code. |
| **Key limitation** | ⚠️ Submitted **source code is private**; only retrievable with an authenticated session. |
| **ToS risk** | 🟠 Medium. LeetCode's ToS prohibits scraping. Using the internal GraphQL API may violate ToS. Relying on session cookies means the user is authorizing access to their own data — stronger justification — but this should be disclosed clearly in the user consent flow and Terms of Service. |
| **Reliability** | 🟡 Medium. The internal GraphQL schema changes without notice. Must monitor for breakage. |
| **Rate limits** | Not officially documented. Aggressive polling will trigger throttling. Treat as rate-limited: max 1 request/second, aggressive cache. |

### 1.2 Path A — Data retrieval (public stats)

| Data | Query target | Notes |
|------|-------------|-------|
| Solved count (easy/medium/hard) | `userProfileUserQuestionProgressV2` GraphQL query | by username, public |
| Topic-level progress | `skillStats` or `userProfileUserQuestionProgressV2` | tag categories |
| Streak / calendar | `userProfileCalendar` | daily submission calendar → heatmap |
| Badges / medals | `userBadges` | for skill badges panel |
| Contest rating | `userContestRanking` | rating + rank history |

Retrieve once per refresh cycle. Cache in Redis (TTL 10 min) + `stats_snapshots` (durable fallback).

### 1.3 Path B — Code sync (authed)

| Data | Query target | Notes |
|------|-------------|-------|
| Accepted submission list | `submissionList` GraphQL (authed) | paginated; filter `status = AC` |
| Source code per submission | `submissionDetails(submissionId)` | returns `code` field (source) |
| Problem statement | `questionContent(titleSlug)` | title, content, constraints, examples — sanitize before storing/rendering |
| Problem metadata | `question(titleSlug)` | number (`frontendId`), difficulty, topics |

**Flow:** fetch submission list (newest-first, paginated) → diff against `problems(user, platform, slug)` where `synced_to_git = false` → for each new problem fetch source + question → push to GitHub → upsert `problems` record → mark `synced_to_git = true`.

### 1.4 Data mapping → internal model

| LC field | Internal field | Notes |
|----------|---------------|-------|
| `frontendId` | `problems.number` | zero-padded e.g. "0369" |
| `titleSlug` | `problems.slug` | unique per problem |
| `title` | `problems.title` | sanitize (untrusted HTML) |
| `difficulty` | `problems.difficulty` | EASY/MEDIUM/HARD → enum |
| `topicTags[].name` | `problems.topics[]` | string array |
| `lang` | `problems.language` | e.g. "python3" → "py" for file ext |
| `code` | GitHub file only | **never stored in DB** |
| `content` (HTML) | `question.md` in GitHub | sanitize + convert to Markdown |
| total solved | `connections.solved_count` | denormalized cache |

---

## 2. Codeforces

### 2.1 Integration overview

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Stats (rating, solved, contests) + code sync |
| **Official API?** | ✅ **Yes** — `codeforces.com/api/` — documented, stable, versioned. |
| **Path A auth** | None for public data; API key optional for higher rate limits |
| **Path B auth** | **API key + secret** pair generated in user's CF account settings. No session cookie needed — this is cleaner and safer than LeetCode. |
| **Data availability** | Public: rating, solved count, contest history, submissions (metadata). With key: same + slightly higher rate limits. **Source code of AC submissions is available publicly via `contest.standings` + `submission` endpoints for public contests.** |
| **ToS risk** | 🟢 Low. Official API. Explicitly for third-party use. Attribution required. |
| **Reliability** | 🟢 High. Official, stable API with versioning. |
| **Rate limits** | **5 requests/second** without auth; **slightly higher** with API key. Must respect this — Codeforces blocks IPs that exceed it. |

### 2.2 Path A — Data retrieval (public stats)

| Data | Endpoint | Notes |
|------|----------|-------|
| Rating + rank | `user.info?handles=` | current + max rating, rank |
| Solved count | `user.status?handle=` → count AC unique problems | not a direct field; must compute |
| Contest history | `user.rating?handle=` | rating changes over time → sparkline |
| Recent submissions | `user.status?handle=&from=1&count=20` | latest AC submissions |
| Problem metadata | `problemset.problems?tags=` | topic/difficulty data |

### 2.3 Path B — Code sync

Codeforces **AC submission source code** is available via `contest.submission?contestId=&submissionId=` for public contests. For gym problems it may not be.

| Data | Endpoint | Notes |
|------|----------|-------|
| AC submissions | `user.status?handle=&from=1&count=1000` | paginate through all |
| Source code | `contest.submission?contestId=X&submissionId=Y` or via web scraping the submission page | Public but not a clean API field — requires per-submission fetch |
| Problem statement | `contest.problems?contestId=` | title + constraints (limited) |

> **Design decision:** Codeforces source code retrieval via official API is limited. May require a session-based fetch of the submission page as a secondary fallback. User authorizes via API key + secret (Path B). This is significantly cleaner than LeetCode — prefer CF's official key-based auth for the sync.

### 2.4 Data mapping → internal model

| CF field | Internal field | Notes |
|----------|---------------|-------|
| `handle` | `connections.username` | |
| `rating` | in `stats_snapshots.payload.ratings` | |
| `problem.contestId` + `problem.index` | `problems.number` | e.g. "1234A" |
| `problem.name` | `problems.title` | |
| `problem.tags[]` | `problems.topics[]` | |
| `programmingLanguage` | `problems.language` | |
| submission source | GitHub file only | |

---

## 3. CodeChef

### 3.1 Integration overview

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Stats (solved, rating, contests) + code sync |
| **Official API?** | ⚠️ Partially. CodeChef had a REST API (now mostly deprecated/limited). The primary method is **authenticated GraphQL / internal API** similar to LeetCode, or scraping profile pages. |
| **Path A auth** | None for public profile page stats |
| **Path B auth** | **Session cookie** from logged-in account (similar to LeetCode Path B) |
| **Data availability** | Public: solved count, rating, rank, recent submissions (metadata). Auth: submission source (via submission detail page). |
| **ToS risk** | 🟠 Medium. No explicit third-party API policy. Session access needs user consent disclosure. |
| **Reliability** | 🟡 Medium. Profile page structure changes. Monitor for breakage. |
| **Rate limits** | Not documented. Treat conservatively: 1 req/2 sec, cache aggressively. |

### 3.2 Path A — Data retrieval

| Data | Source | Notes |
|------|--------|-------|
| Rating / rank | User profile page or `api.codechef.com` (if available) | parse from profile JSON embedded in page |
| Solved problems count | Profile page or submission history | aggregate AC unique problems |
| Recent submissions | Submission history endpoint | filter AC |
| Contest participation | Contest page | rating history |

### 3.3 Path B — Code sync

| Data | Source | Notes |
|------|--------|-------|
| AC submissions | Submission history (authed) | paginate |
| Source code | Submission detail page (authed) | extract code block |
| Problem statement | Problem page | title + constraints |

### 3.4 Data mapping → internal model

| CC field | Internal field | Notes |
|----------|---------------|-------|
| username | `connections.username` | |
| problem code | `problems.slug` / `number` | e.g. "PRIME1" |
| problem name | `problems.title` | |
| tags/category | `problems.topics[]` | limited on CC |
| language | `problems.language` | |
| rating | `stats_snapshots.payload.ratings` | |

---

## 4. HackerRank

### 4.1 Integration overview

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Stats (solved, skills, certifications) + code sync |
| **Official API?** | ⚠️ HackerRank has a **Work API** (for recruiters) not applicable here. Profile stats use internal endpoints. |
| **Path A auth** | None for public profile badge data |
| **Path B auth** | **Session cookie** from logged-in account |
| **Data availability** | Public: skill badges, solved count per track. Auth: submission code via submission history. |
| **ToS risk** | 🟠 Medium. Similar to CodeChef — no explicit third-party data API. |
| **Reliability** | 🟡 Medium. |
| **Rate limits** | Conservative: 1 req/2 sec. |

### 4.2 Path A — Data retrieval

| Data | Source | Notes |
|------|--------|-------|
| Skill badges (hexagon) | Public profile `hackerrank.com/:username` | parse skill scores + badge levels |
| Solved count per track | Profile page | algorithms, data structures, etc. |
| Certifications | Profile certifications page | |
| Contest participation | Public contest history | |

### 4.3 Path B — Code sync

HackerRank submissions are tied to challenges inside tracks/contests. Source code retrieval requires auth.

| Data | Source | Notes |
|------|--------|-------|
| AC submissions | Submission history (authed) | per-track pagination |
| Source code | Submission detail (authed) | extract code |
| Problem statement | Challenge page | title + difficulty |

### 4.4 Data mapping → internal model

| HR field | Internal field | Notes |
|----------|---------------|-------|
| username/handle | `connections.username` | |
| challenge slug | `problems.slug` | |
| challenge name | `problems.title` | |
| track/domain | `problems.topics[]` | mapped to topic categories |
| language | `problems.language` | |
| badge level | in `stats_snapshots.payload.metadata` jsonb | platform-specific |

---

## 5. GitHub (git-service — not a user platform, but a push target)

| Attribute | Detail |
|-----------|--------|
| **Purpose** | Push per-problem folders (`<number>/question.md` + `solution.<ext>`) + README index |
| **Auth** | GitHub OAuth token (stored encrypted in `oauth_identities`) — scoped to **specific repo** (not all repos) |
| **API** | Official GitHub REST API v3 / GraphQL v4 |
| **Scope required** | `repo` (single repo) — **minimize scope per SECURITY_PLAN §2** |
| **Rate limits** | 5,000 requests/hour (authenticated). Each sync = ~3 API calls per new problem (check file exists, write file, commit). Budget: ~1,600 problems/hour max. |
| **Reliability** | 🟢 High. Official API with SLAs. |
| **ToS** | 🟢 Clean. Standard API use. |

**GitHub push flow:**
```
1. Ensure repo exists (create if not)
2. For each new problem:
   a. Create/update <number>/question.md (sanitized question content)
   b. Create/update <number>/solution.<ext> (source code)
3. Regenerate README.md (index table: number | title | difficulty | language | platform)
4. Commit all changes in one commit (batch, not per-file)
```
> **Batch commits per sync run** — one commit per sync, not one per problem. Keeps the repo history clean and reduces API calls.

---

## 6. Synchronization Strategy (all platforms)

### 6.1 Trigger types

| Trigger | Who | Frequency | Notes |
|---------|-----|-----------|-------|
| **Scheduled** (auto) | git-service cron | Configurable; default every 6 hours | Per-user, per-connection job enqueued |
| **Manual** | User via UI | On demand | Rate-limited (1 per connection per 15 min) |
| **Event-driven** | Future: platform webhooks | If platform supports it | None of the 4 platforms have public webhooks today |

### 6.2 Background job flow
```
Cron tick ─▶ for each active Connection (not expired):
               enqueue SyncJob(userId, connectionId) ─▶ Redis queue
                 │
              Worker picks up:
                1. Lock (per connectionId — no parallel runs for same connection)
                2. Decrypt session token (from connection_secrets via KMS)
                3. Fetch platform AC submissions (Path B) — paginated
                4. Diff against problems(user, platform) — find new slugs
                5. For each new: fetch source + question → push to GitHub (batched)
                6. Upsert problems records (idempotent on slug)
                7. Update sync_runs, connections.last_synced_at, solved_count
                8. Emit notification (success / partial / expired)
                9. Release lock
```

### 6.3 Path A refresh (stats, independent of sync)
```
Endpoint call ─▶ check Redis cache (user+platform key, TTL 10 min)
                   hit ─▶ return cached AggregatedStats
                   miss ─▶ fetch platform public stats (parallel, per connection)
                           ─▶ aggregate ─▶ write Redis + stats_snapshots
                           ─▶ return AggregatedStats
                    DB fallback: if upstream fails → serve last stats_snapshot
```

---

## 7. Rate Limiting Strategy (per platform)

| Platform | Known limit | Our policy | Cache TTL | Retry |
|----------|------------|-----------|----------|-------|
| LeetCode GraphQL | Undocumented | 1 req/sec max; burst: 5 | 10 min stats | Exponential backoff: 1s→2s→4s→8s (max 3 retries) |
| Codeforces API | 5 req/sec | 3 req/sec (conservative) + jitter | 10 min stats | Same; respect `Retry-After` header |
| CodeChef | Undocumented | 1 req/2 sec | 15 min stats | Same |
| HackerRank | Undocumented | 1 req/2 sec | 15 min stats | Same |
| GitHub API | 5,000/hr | Monitor X-RateLimit-Remaining; pause at <100 | Metadata: 30 min | Wait for reset window |

**Queue management:** BullMQ with per-platform concurrency caps (e.g., max 3 concurrent LeetCode workers, 5 CF workers). Jobs include `platform` tag for routing. Stale jobs (stuck > 30 min) auto-fail.

**Backoff formula:** `min(base * 2^attempt, maxDelay) + random(0, 1000ms)` — the jitter prevents thundering-herd when many sessions expire simultaneously.

---

## 8. Failure Handling

| Failure | Detection | Response | User notification |
|---------|-----------|---------|-----------------|
| Platform down / timeout | HTTP 5xx or timeout after 15s | Mark sync run `failed`, re-queue after 1 hr | No notification (transient; retry silently) |
| Session expired | HTTP 401 / 403 from platform | Mark `connection.token_status = expired`; stop syncing | ✅ Notification: "LeetCode session expired — reconnect to resume sync" |
| Invalid/unexpected response shape | Parsing error | Mark run `partial`; log; skip affected submissions | ✅ Notification: "Sync partially completed" |
| GitHub API error | HTTP 4xx/5xx | Retry (rate-limit), abort + mark failed | ✅ Notification if persistent |
| Partial failure (some problems ok, some not) | Per-problem error tracking | Sync those that succeeded; mark failed ones for retry | `sync_runs.status = partial` surfaced in UI |
| All platforms failing simultaneously | Dashboard reads stale `stats_snapshots` | Serve last-known data with `degraded` flag in response | ✅ Subtle "Data may be outdated" indicator |
| Queue backlog | Queue depth metric alert | Scale workers; alert ops | No user notification (ops issue) |

---

## 9. Data Consistency

| Concern | Strategy |
|---------|---------|
| **Duplicate problems** | Unique constraint on `(user_id, platform, slug)` — upsert on sync, never duplicate |
| **Stale stats** | Redis TTL + `stats_snapshots.fetched_at` for age; UI can show "Last updated X min ago" |
| **Sync conflict (same problem, 2 workers)** | Per-connection advisory lock in Redis; only one worker per connection at a time |
| **Code updated on platform** | Current scope: don't re-sync existing problems (solution code is immutable once accepted). Future: versioned solutions. |
| **Problem re-numbered / renamed** | Slug is the stable identity; title/number updates don't create duplicates |
| **GitHub push conflict** | git-service always fetches current ref before pushing; retries on conflict |
| **Token rotation** | `key_version` on encrypted fields enables zero-downtime KMS key rotation (decrypt old, re-encrypt new) |

---

## 10. Platform Adapter Architecture (extensibility)

> Adding a new platform = adding one adapter file. No other files change.

```
git-service/src/
  services/
    submissions/              ← one file per platform (Path B)
      leetcode.adapter.ts     ← implements PlatformAdapter interface
      codeforces.adapter.ts
      codechef.adapter.ts
      hackerrank.adapter.ts
      [newplatform].adapter.ts ← add this
  platforms/                  ← one file per platform (Path A)
    leetcode.stats.ts
    codeforces.stats.ts
    codechef.stats.ts
    hackerrank.stats.ts
    [newplatform].stats.ts     ← add this
```

**PlatformAdapter interface (conceptual, no code):**
- `fetchAcceptedSubmissions(sessionToken, handle, lastSyncedAt) → SubmissionPage[]`
- `fetchSubmissionCode(sessionToken, submissionId) → SourceCode`
- `fetchProblemStatement(handle, slug) → ProblemStatement`
- `validateSession(sessionToken) → { valid: boolean, expiresAt?: Date }`

**PlatformStatsProvider interface (conceptual, no code):**
- `fetchStats(handle) → RawPlatformStats`
- `mapToAggregatedStats(raw) → Partial<AggregatedStats>`

**Adding a new platform checklist:**
- [ ] Add enum value to `platform_type` enum (single DB migration)
- [ ] Write adapter (Path B) implementing `PlatformAdapter`
- [ ] Write stats provider (Path A) implementing `PlatformStatsProvider`
- [ ] Register in adapter registry
- [ ] Add platform badge/colour to frontend constants
- [ ] Update `PLATFORM_INTEGRATION.md`
- [ ] Write adapter-specific tests
- [ ] No changes to API routes, DB schema (except enum), or orchestrator

---

## 11. Legal & Consent Framework

| Platform | ToS risk | Mitigation |
|----------|----------|-----------|
| LeetCode | 🟠 Medium | Explicit user consent at connect time; display scope; user's own data only; no bulk scraping of problems for others; rate-limit to avoid abuse |
| Codeforces | 🟢 Low | Official API; attribution; rate limits respected |
| CodeChef | 🟠 Medium | User consent; own data only |
| HackerRank | 🟠 Medium | User consent; own data only |
| GitHub | 🟢 Low | Official API; minimum scope |

**Consent flow (at connect-authorize):**
1. Display exactly what data will be fetched ("your accepted submissions and source code on LeetCode").
2. Explain what it's used for ("organized into a private/public GitHub repo you control").
3. Explain session token handling ("stored encrypted, used only for sync, deleted when you disconnect").
4. Require explicit confirmation before authorizing.
5. Link to Privacy Policy.

> **Legal note (from SECURITY_PLAN):** storing session cookies may violate platform ToS. This risk should be disclosed in the CodeVault Terms of Service, and users should understand they're authorizing their own data retrieval. Keep this under review as platforms evolve their policies.


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [x] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
