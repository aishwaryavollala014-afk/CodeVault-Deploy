<div align="center">

# ✨ CodeVault — Feature Catalog

### Every feature, its status, owner, and where it lives in the code.

</div>

> **What this is:** the single source of truth for *what CodeVault does today* vs *what is planned*.
> Status is derived from the actual code (routes mounted, services wired, pages calling backends) — not from aspirational plans. Last synced with the codebase: see git history for this file.
> 📋 For a checkbox-style progress tracker with % done per area, see **[PROGRESS.md](PROGRESS.md)**.
> 🔄 *Update after Aish commit `8d30a67`:* dashboard, analytics & repositories pages now call **real** backends (mock removed); Codeforces stats now aggregated. Rows below reflect this.

**Legend** — ✅ Done & wired · 🟠 Partial / mock / not wired end-to-end · ⛔ Planned (not built) · 🔒 By-design limitation

**Owners** — **A** = Aishwarya (web-backend, stats/profile frontend) · **G** = Gaurav (git-service, browser-extension, sync/repos frontend)

---

## 📑 Table of Contents

1. [Feature map at a glance](#-feature-map-at-a-glance)
2. [Authentication & accounts](#-authentication--accounts)
3. [Platform connections](#-platform-connections)
4. [Path A — Public stats & analytics](#-path-a--public-stats--analytics)
5. [Path B — Code sync to GitHub](#-path-b--code-sync-to-github)
6. [Browser extension (Path B v2)](#-browser-extension-path-b-v2)
7. [Public shareable profile](#-public-shareable-profile)
8. [Notifications](#-notifications)
9. [Repositories view](#-repositories-view)
10. [Settings](#-settings)
11. [Background jobs & scheduling](#-background-jobs--scheduling)
12. [Security & data protection](#-security--data-protection)
13. [Known gaps / broken parts](#-known-gaps--broken-parts)
14. [Planned / roadmap features](#-planned--roadmap-features)

---

## 🗺 Feature map at a glance

| Feature | Status | Owner | Lives in |
|---------|:------:|:-----:|----------|
| GitHub OAuth login | ✅ | A | `web-backend/auth.*`, `web-frontend/login/callback` |
| Email magic-link login | ✅ | A | `web-backend/auth.*`, `web-frontend/login/callback/email` |
| Add / list / remove platform connections | ✅ | A | `web-backend/platform.*`, `web-frontend/connect` |
| Path A stats — LeetCode | ✅ | A | `web-backend/services/platforms/leetcode.ts` |
| Path A stats — Codeforces | ✅ | A | aggregated in `stats.service.ts` (Aish `8d30a67`) |
| Path A stats — CodeChef | ✅ | G | profile scrape (solved + rating/stars), aggregated (`71e4a6c`) |
| Path A stats — HackerRank | ✅ | A | badges API, aggregated |
| Unified analytics dashboard | ✅ | A | `(app)/dashboard` wired to `GET /api/stats`; incl. CodeChef rating tile (`bc75483`) |
| Public shareable profile | ✅ | G | `web-frontend/u/[username]` wired to `/api/public` (`b98b115`) |
| GitHub repo setup | ✅ | A/G | `web-backend/githubRepo.*` |
| Path B code sync — LeetCode | ✅ | G | `git-service/services/submissions/leetcode.service.ts` |
| Path B code sync — CF / CC / HR | 🔒 | G | degrade to `[]` (platform ToS / no code API) |
| Auto-generated repo README index | ✅ | G | `git-service/services/github/readme.generator.ts` |
| Scheduled auto-sync | ✅ | G | `git-service/jobs/scheduler.ts`, `sync.job.ts` |
| Sync status / activity page | ✅ | G | `web-frontend/(app)/sync-status` |
| Browser extension capture (Path B v2) | ✅ | G | build-verified; **LeetCode capture working live** — full submitted code, **all languages** via `submissionDetails` GraphQL (`a108f37`→`fc530bd`) |
| Extension → git-service ingest | ✅ | G | `git-service/ingest.*`, `POST /api/ingest` |
| Notifications | ✅ | G | service + controller + routes mounted `/api/notifications`; bell dropdown + emit on connect (`96f6ac2`) |
| Global search + branded loader | ✅ | G | topbar page/settings search + animated CodeVault loader across pages |
| Repositories browser page | ✅ | A | `(app)/repositories` wired to `GET /api/github-repos` |
| git-service `/api/repos` + `/api/problems` | ✅ | G | built & mounted, JWT-auth, keyset pagination (`de8c6ed`) |
| Per-platform repo-link manager | ✅ | G | Settings → GitHub, wired to `POST /api/github-repos` (`aff4c53`) |
| Settings page | ✅ | G | real connected platforms + repo manager + disconnect wired (`32fca74`); some cosmetic sections static |
| Analytics per-platform tabs | ✅ | G | All / LeetCode / Codeforces / CodeChef / HackerRank filtering (`7e69389`) |
| AI explain / recommend next problem | ⛔ | — | planned |

---

## 🔐 Authentication & accounts

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| GitHub OAuth sign-in | ✅ | A | End-to-end verified. `POST /api/auth/github` exchanges code → JWT; frontend `login/callback` lands on dashboard. |
| Email magic-link login | ✅ | A | `POST /api/auth/email` requests a link, `POST /api/auth/email/verify` completes it. Uses `VerificationToken` + `mailer.service.ts` (nodemailer). |
| Current-user endpoint | ✅ | A | `GET /api/auth/me` (requires auth). |
| JWT sessions | ✅ | A/G | Same JWT verified by **both** services (`web-backend/lib/jwt.ts`, `git-service/lib/jwt.ts`). `AuthSession` table tracks sessions. |
| Refresh-token rotation | ⛔ | A | `AuthSession` schema supports it; rotation endpoint not yet wired. |

**Endpoints:** `POST /api/auth/github` · `POST /api/auth/email` · `POST /api/auth/email/verify` · `GET /api/auth/me`

---

## 🔌 Platform connections

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Add a platform username | ✅ | A | `POST /api/platforms/connect`. Optional session secret stored encrypted (`ConnectionSecret`, AES via `lib/crypto.ts`). |
| List connections | ✅ | A | `GET /api/platforms`. |
| Remove a connection | ✅ | A | `DELETE /api/platforms/:platform`. |
| Session-expiry tracking | ✅ | A/G | `TokenStatus` enum on connection; expired sessions surfaced instead of failing silently. |

Supported platforms: **LeetCode, Codeforces, CodeChef, HackerRank** (`PlatformType` enum).

---

## 📊 Path A — Public stats & analytics

*Username-only public stats. No authorization required. Always available.*

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| LeetCode public stats | ✅ | A | GraphQL fetch, Redis-cached (`stats.service.ts` → `platforms/leetcode.ts`). |
| Codeforces stats | ✅ | A | Official API, aggregated in `stats.service.ts`. |
| CodeChef stats | ✅ | G | Profile-page scrape (solved + rating/stars/rank), aggregated. |
| HackerRank stats | ✅ | A | `/rest/hackers/<u>/badges` (sum of solved), aggregated. |
| Aggregated dashboard stats API | ✅ | A | `GET /api/stats` — all 4 platforms contribute. |
| Dashboard UI | ✅ | A | `(app)/dashboard` calls `GET /api/stats`; real totals, difficulty, CodeChef rating tile. |
| Difficulty / language breakdown | ✅ | A | Real LeetCode difficulty + Codeforces language data on dashboard/analytics. |
| Activity heatmap | 🟠 mock | A | `ActivityHeatmap.tsx` still uses random `MOCK_LEVELS`. |

**Endpoint:** `GET /api/stats` (auth)

---

## 📦 Path B — Code sync to GitHub

*One-time authorized fetch of your own accepted submissions → committed to your repo.*

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Trigger a sync run | ✅ | G | `POST /api/sync` (JWT-auth, rate-limited, Zod-validated). |
| Sync status | ✅ | G | `GET /api/sync/status` — synced count, last run, expiry. |
| Sync activity log | ✅ | G | `GET /api/sync/activity`. |
| LeetCode submission + code + question fetch | ✅ | G | `submissions/leetcode.service.ts` (GraphQL, session cookie). |
| CF / CC / HR code sync | 🔒 | G | Degrade to `return []` by design — those platforms expose no authorized source-code API (ToS). Stats (Path A) still work. |
| Per-problem folder push (`<number>/question.md` + `solution.<ext>`) | ✅ | G | `services/github/github.service.ts`. |
| Auto-generated repo README index | ✅ | G | `services/github/readme.generator.ts`. |
| Dedupe against already-synced problems | ✅ | G | `Problem` + `SyncRun` tables. |
| Expired-session handling | ✅ | G | `ExpiredSessionError` → prompts reconnect. |
| SSRF egress guard on outbound fetches | ✅ | G | `lib/egress.ts`. |

**Endpoints:** `POST /api/sync` · `GET /api/sync/status` · `GET /api/sync/activity` · `POST /api/ingest`

---

## 🧩 Browser extension (Path B v2)

*Capture-at-source: reads your own accepted code from the page you're already signed into.*

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| MV3 scaffold + build (CRXJS + Vite) + icons | ✅ | G | **build-verified** (`npm run build`), loads unpacked. |
| LeetCode capture | ✅ | G | DOM-verdict detection + **`submissionDetails` GraphQL** → **full code, every language** + **full `question.md`** (`question.content`: statement/examples/I-O) + latest-Accepted lookup so `/description/` isn't the editor template (`fc530bd`, `37e8b80`). **Verified live 2026-07-12**. |
| Self-heal ingest | ✅ | G | git-service re-pushes when captured code changes (`codeHash` in `problem.metadata`) → stuck templates auto-fix (`94f3949`). |
| Codeforces capture | 🟠 | G | Extension via same-origin `/data/submitSource` (`f8a5c6f`); built, live-verify pending. **Server-side handle-only sync is impossible** — CF source is Cloudflare-gated (verified: `user.status`=200, source page + `/data/submitSource`=403 server-side); the in-browser extension is the only path. |
| CodeChef / HackerRank capture | 🟠 | G | CodeChef via `viewplaintext` (`c207804`), HackerRank via REST `/submissions` (`8775b6c`); built, live-verify pending. |
| CodeVault web-app content script (JWT capture) | ✅ | G | `content/codevault.ts` reads the JWT from the signed-in web app. |
| Background service worker | ✅ | G | `background/index.ts` owns the token, dispatches ingest. |
| Ingest to git-service | ✅ | G | `POST /api/ingest` (JWT verify + GitHub push). |
| Options page + token refresh + store packaging | 🟠 | G | `options/main.ts` empty; JWT from localStorage has no refresh yet. |

> ⚠️ **Doc drift:** `browser-extension/README.md` describes a PKCE `launchWebAuthFlow` handoff, but the implementation reads the JWT via the web-app content script (`WEB_APP_URL`). Reconcile before shipping.

---

## 🌐 Public shareable profile

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Public profile API by handle | ✅ | A | `GET /api/public/:handle` (no auth). |
| Public profile page | ✅ | G | `u/[username]` wired to `/api/public` — real totals, difficulty, per-platform bars, and real activity heatmap. |

**Endpoint:** `GET /api/public/:handle` (no auth)

---

## 🔔 Notifications

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Notification service + `Notification` table | ✅ | G | `notification.service.ts` — list / unread-count / mark-read / create. |
| Notifications API | ✅ | G | `notification.controller.ts` + `notification.routes.ts`, **mounted** at `/api/notifications`. |
| Notifications UI | ✅ | G | Topbar **bell dropdown** — unread badge, mark-all-read; emits on platform connect. |
| More emit triggers (sync complete / session expired) | 🟠 | G | Only connect-emit today. |

---

## 📁 Repositories view

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Repositories page (list) | ✅ | A | `(app)/repositories` wired to `GET /api/github-repos`; deep file/commit browsing components still render static data. |
| `/api/repos` + `/api/problems` endpoints | ✅ | G | Built & mounted in `git-service` — JWT-auth, keyset pagination (`de8c6ed`). Frontend deep-browse can now wire to these. |

---

## ⚙️ Settings

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Settings page | ✅ | A/G | `(app)/settings` wired to API, fully functional. |
| Settings API | ✅ | A | `settings.controller/service/routes` built and mounted at `/api/settings`. |
| Plans / pricing | ⛔ | — | Deferred. |

---

## ⏰ Background jobs & scheduling

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| BullMQ job queue | ✅ | G | `jobs/queue.ts` (Redis-backed). |
| Cron scheduler at boot | ✅ | G | `jobs/scheduler.ts` (node-cron) registers periodic auto-sync. |
| Periodic auto-sync of active connections | ✅ | G | `jobs/sync.job.ts` — syncs each active connection, flags expired sessions. |

---

## 🛡 Security & data protection

| Feature | Status | Owner | Details |
|---------|:------:|:-----:|---------|
| Encrypted platform secrets at rest | ✅ | A/G | AES via `lib/crypto.ts`; `ConnectionSecret` table. |
| Helmet + CORS hardening | ✅ | A/G | Both services. |
| Per-route rate limiting | ✅ | A/G | `rateLimit.middleware.ts`. |
| Zod request validation | ✅ | A/G | `validate.middleware.ts` + validators. |
| Request-ID tracing | ✅ | G | `requestId.middleware.ts` (git-service). |
| Row-Level Security (owner isolation) | 🟠 | A | `database/rls.sql` written, **not enabled** yet. |
| Audit log | ✅ | A | `AuditLog` table + `AuditAction` enum. |
| Secrets in `.env` only | ✅ | A/G | `.env.example` per service; gitleaks config at root. |

Full security blueprint: see the `*_SECURITY.md` docs in this folder.

---

## 🚧 Known gaps / broken parts

*(Cross-references [the analysis in chat]; keep in sync as these are fixed.)*

| # | Gap | Severity | Owner |
|:-:|-----|:--------:|:-----:|
| 1 | ~~`stats.service.ts` aggregates LeetCode only~~ → **FIXED**: all 4 platforms aggregate (CodeChef `71e4a6c`, HackerRank) | ✅ | A/G |
| 2 | ~~Dashboard / analytics / public-profile show static mock~~ → **FIXED**: dashboard/analytics/repos (Aish `8d30a67`) + public profile (`b98b115`) wired | ✅ | A/G |
| 3 | ~~`notification` routes not mounted~~ → **FIXED**: notifications fully built + mounted (`96f6ac2`). `user`/`settings` routes still unmounted (low priority) | ✅/🟠 | G/A |
| 4 | ~~`problem` / `repo` routes not mounted in git-service~~ → **FIXED**: built & mounted, `/api/repos` + `/api/problems` live (`de8c6ed`) | ✅ | G |
| 5 | ~~Repositories page mock~~ → **FIXED**: per-connected-platform inline repo-attach (`125906d`); deep file/commit browse via `/problems` still to wire | 🟠 | G |
| 6 | ~~Extension build-verify + LeetCode capture untested~~ → **FIXED**: built + LeetCode full-code capture verified live 2026-07-12 (`fc530bd`). Remaining: README (PKCE) ≠ actual JWT-capture impl; **CF/CC/HR** selectors still untested live | 🟠 | G |
| 7 | Prisma schema **duplicated** across `web-backend/prisma` + `git-service/prisma` — hand-sync required | ⚠️ | Both |

**Still open:** #5 (repositories *deep* file/commit browse), #6 (extension README drift + CF/CC/HR live selectors), #7 (schema dup). *(Notifications #3 done; extension build-verify + LeetCode capture done; Settings API mounted and wired.)*

---

## 🔭 Planned / roadmap features

| Feature | Owner | Notes |
|---------|:-----:|-------|
| ~~Aggregate all 4 platforms · wire dashboard/profile · notifications · `/repos`+`/problems`~~ | — | ✅ **all done this cycle** |
| Real activity heatmap (dashboard) from real solve data | A | 🟢 **done this cycle** (both dashboard and public profile now use real API heatmap) |
| Repositories **deep** file/commit browse (wire to `/api/problems`) | G | Endpoint live; frontend pending. |
| JWT refresh-token rotation endpoint | A | Schema ready. |
| Enable Row-Level Security before prod | A | `database/rls.sql`. |
| CF / CC / HR extension live selector test | G | LeetCode done + verified; port `submissionDetails`-style full-code capture to the other three. |
| AI layer — explain solution, tag topic, recommend next problem | — | Uses the latest Claude models. |
| Gamification — streaks, goals, shareable cards | — | Deferred. |
| Pricing / plans page | — | Deferred. |

---

<div align="center">

**Keep this file honest.** When a feature moves from 🟠/⛔ to ✅, update the row *in the same commit* that wires it.

</div>

---

## 📱 Mobile app (`mobile/`) — Expo Go

Feature-parity client mirroring the web app against the same backends (owner: Gaurav).

| Feature | Status | Source |
|---------|--------|--------|
| Email magic-link login (real GitHub-linked account) | ✅ | `web-backend /api/auth/email*` |
| Dashboard: totals, difficulty donut, per-platform bars, 12-month heatmap | ✅ | `GET /api/stats` |
| Analytics: ratings, difficulty, topics, languages, activity | ✅ | `GET /api/stats` |
| Recent submissions (all platforms, tappable) | ✅ | `git-service GET /api/problems` |
| Repositories & Sync (with "Sync now") | ✅ | `git-service /api/repos`, `/api/sync*` |
| Inbox + chat thread (send) | ✅ | `web-backend /api/messages*` |
| Public profile, Settings (connections, auto-sync), Notifications, Connect | ✅ | web-backend |
| GitHub OAuth sign-in | ⛔ | needs backend token-handoff (deep-link callback limitation) |
| Problem detail (full question/solution) | 🟠 | stub — next phase |

Full doc: [MOBILE_APP.md](MOBILE_APP.md).
