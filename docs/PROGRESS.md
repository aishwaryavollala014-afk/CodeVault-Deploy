<div align="center">

# ✅ CodeVault — Progress Checklist

### One place to see what's **done**, **in progress**, and **pending** — verified against the code.

</div>

> 🧭 Companion to [FEATURES.md](FEATURES.md) (feature detail) and [ROADMAP.md](ROADMAP.md) (the plan).
> Checkboxes here reflect the **actual codebase** as of the last commit that touched this file — not aspirations.
> Legend: `[x]` done & wired · `[~]` partial (see note) · `[ ]` not started. **Owner:** A = Aishwarya · G = Gaurav.

---

## 📊 Overall status

| Area | Done | Partial | Pending | % done* |
|------|:----:|:-------:|:-------:|:------:|
| Foundation / DB / infra | 6 | 0 | 1 | ~85% |
| Auth & accounts | 4 | 0 | 1 | ~80% |
| Platform connections | 4 | 0 | 0 | 100% |
| Path A — stats & dashboard | 9 | 0 | 1 | ~92% |
| Path B — code sync (git-service) | 7 | 0 | 1 | ~90% |
| Browser extension | 4 | 2 | 0 | ~70% |
| Public profile | 2 | 0 | 0 | ~90% |
| Notifications | 3 | 0 | 0 | ~95% |
| Repositories | 4 | 0 | 0 | ~95% |
| Settings / UI-UX | 5 | 0 | 0 | ~90% |
| Pre-launch / compliance | 0 | 0 | ~61 | 0% |

\* *Rough, feature-count based — not weighted by effort.*

**Headline:** core product loop (login → connect → stats dashboard → public profile → GitHub sync) is **working end-to-end with real data for all 4 platforms** (LeetCode, Codeforces, CodeChef, HackerRank). All git-service routes live; **notifications, global search, per-platform analytics tabs, and a branded animated loader** now shipped. Remaining code work: real activity heatmap, refresh-token rotation, RLS, extension build-verify — then **pre-launch/compliance**.

---

## 🏗 Foundation, database & infra
- [x] Monorepo scaffold (web-frontend / web-backend / git-service / browser-extension) — G
- [x] Docker + Colima: Postgres (5433) + Redis (6380) — G
- [x] Postgres schema: 12 enums / 11 tables (Prisma) — A
- [x] Views / triggers / functions + least-priv roles applied to dev — A
- [x] Encryption + JWT secrets shared across both services — A/G
- [x] Redis wired (cache + queue) — G
- [ ] Enable Row-Level Security (`database/rls.sql` written, **not enabled**) — A

## 🔐 Auth & accounts
- [x] GitHub OAuth login — end-to-end verified — A
- [x] Email magic-link login (request + verify) — A
- [x] `GET /api/auth/me` current user — A
- [x] Shared JWT verified by web-backend **and** git-service — A/G
- [ ] Refresh-token rotation endpoint (schema ready, not wired) — A

## 🔌 Platform connections
- [x] Add platform username (`POST /api/platforms/connect`) — A
- [x] List connections (`GET /api/platforms`) — A
- [x] Remove connection (`DELETE /api/platforms/:platform`) — A
- [x] Encrypted session secret storage + expiry tracking — A/G

## 📊 Path A — public stats & analytics dashboard
- [x] LeetCode public stats (GraphQL, Redis-cached) — A
- [x] Codeforces public stats (official API) — A ✨ *new (Aish commit `8d30a67`)*
- [x] Aggregated `GET /api/stats` — A
- [x] **Dashboard wired to real stats** (mock `1,248` removed) — A ✨ *new*
- [x] **Analytics page wired to backend** — A ✨ *new*
- [x] CodeChef stats — profile scrape (solved + rating/stars), aggregated — G ✨ *new (`71e4a6c`)*
- [x] HackerRank stats — badges API, aggregated — A ✨ *new*
- [x] CodeChef rating/stars **dashboard tile** (rating, stars, peak, global rank) — G ✨ *new (`bc75483`)*
- [x] **Analytics per-platform filter tabs** (All / LeetCode / Codeforces / CodeChef / HackerRank — separate analysis) — G ✨ *new (`7e69389`)*
- [x] **Recent submissions: clickable problem links + dd/mm/yyyy dates** — G ✨ *new (`e54c9df`)*
- [ ] Activity heatmap on **real** solve data (currently random `MOCK_LEVELS`) — A

## 📦 Path B — code sync to GitHub (git-service)
- [x] Trigger sync (`POST /api/sync`) — G
- [x] Sync status + activity (`GET /api/sync/status`, `/activity`) — G
- [x] LeetCode accepted-code + question fetch — G
- [x] Per-problem folder push + auto README index — G
- [x] BullMQ queue + worker + node-cron scheduler — G
- [x] SSRF egress guard on outbound fetches — G
- [x] **`GET /api/repos` + `GET /api/problems` built & mounted** (JWT-auth, keyset pagination) — G ✨ *new (`de8c6ed`)*
- [ ] CF / CC / HR code sync — 🔒 by design (no authorized source API; degrade to `[]`) — G

## 🧩 Browser extension (Path B v2)
- [x] MV3 scaffold (CRXJS + Vite), manifest — G
- [x] Content scripts: LeetCode / CF / CC / HR — G
- [x] Background worker + JWT capture from web app + popup/options — G
- [x] Ingest to git-service (`POST /api/ingest`) — G
- [~] Build-verify (`npm run build`) — not yet run — G
- [~] Live selector testing on each platform — pending — G

## 🌐 Public shareable profile
- [x] Public profile API (`GET /api/public/:handle`, no auth) — A
- [x] `u/[username]` page **wired to `/api/public`** (real totals, difficulty, per-platform bars; mock removed) — G ✨ *new (`b98b115`)*
  - *(heatmap + topic-strengths sections remain decorative — API returns no daily/topic data yet)*

## 🔔 Notifications ✨ *now fully built (G, `8469bd8`→`96f6ac2`)*
- [x] Notification **service** (list / unread-count / mark-read / create) — G
- [x] Notification **controller + routes**, **mounted** at `/api/notifications` — G
- [x] Emits a real notification **on platform connect** — G
- [x] **Bell dropdown UI** in topbar (unread badge + mark-all-read) — G
- [ ] More emit triggers (sync complete, session expired) — G

## 📁 Repositories
- [x] Repositories page wired to `GET /api/github-repos` (web-backend) — A
- [x] GitHub repo setup flow (`POST /api/github-repos`) — A
- [x] **Per-platform repo-link manager** in Settings → GitHub — G (`aff4c53`)
- [x] **Repositories page: per-connected-platform inline repo-link attach** (only shows connected platforms) — G ✨ *new (`125906d`)*
- [x] git-service `/repos` + `/problems` endpoints **live** — G (`de8c6ed`)

## 🎨 Settings & UI/UX ✨ *new*
- [x] Settings **Connected platforms** render real `/api/platforms` data + working Disconnect — G (`32fca74`)
- [x] Per-platform GitHub repo manager in Settings — G (`aff4c53`)
- [x] **Global page/settings search** in topbar — G (`b96f024`)
- [x] **Functional refresh** button in topbar — G (`d339906`)
- [x] **Animated branded CodeVault loader** across all pages — G (`38613cf`)

## 🚀 Pre-launch / compliance (`CERTIFICATES_BEFORE_LAUNCH/`)
- [ ] **All ~61 items pending** — legal (ToS, Privacy, GDPR/CCPA), security certs (SOC2, ISO 27001, pentest), DNS/email (SPF/DKIM/DMARC), launch checklist, etc.
- These are **operational/external** milestones for production launch; none are implemented yet. See [CERTIFICATES_BEFORE_LAUNCH/LAUNCH_CHECKLIST.md](../CERTIFICATES_BEFORE_LAUNCH/LAUNCH_CHECKLIST.md).

---

## ⚠️ Team-sync flags (things one dev may not know the other finished)
- The **browser extension, BullMQ queue engine, and cron scheduler are already BUILT** (Gaurav / git-service + extension) — but [FUTURE_IMPLEMENTATION_TASKS.md](FUTURE_IMPLEMENTATION_TASKS.md) and [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) list them as future work. Those docs reflect the frontend/web-backend vantage; treat **this file + FEATURES.md** as the reconciled truth.
- Two Prisma schemas (`web-backend/prisma`, `git-service/prisma`) are hand-synced duplicates — change both together.

---

<div align="center">

**Keep this honest.** Tick a box in the *same commit* that makes it true. If you can't verify it from the code, leave it unchecked.

</div>
