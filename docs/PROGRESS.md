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
| Path A — stats & dashboard | 5 | 2 | 1 | ~65% |
| Path B — code sync (git-service) | 6 | 0 | 2 | ~75% |
| Browser extension | 4 | 2 | 0 | ~70% |
| Public profile | 1 | 1 | 0 | ~50% |
| Notifications | 1 | 1 | 1 | ~40% |
| Repositories | 2 | 0 | 1 | ~65% |
| Pre-launch / compliance | 0 | 0 | ~61 | 0% |

\* *Rough, feature-count based — not weighted by effort.*

**Headline:** core product loop (login → connect → stats dashboard → GitHub sync) is **working end-to-end for LeetCode**. Remaining work is breadth (more platforms), wiring already-built backends (unmounted routes), and everything under **pre-launch/compliance**.

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
- [~] CodeChef stats — service exists, **not aggregated** in `stats.service.ts` — A
- [~] HackerRank stats — service exists, **not aggregated** — A
- [ ] Activity heatmap on **real** solve data (currently random `MOCK_LEVELS`) — A

## 📦 Path B — code sync to GitHub (git-service)
- [x] Trigger sync (`POST /api/sync`) — G
- [x] Sync status + activity (`GET /api/sync/status`, `/activity`) — G
- [x] LeetCode accepted-code + question fetch — G
- [x] Per-problem folder push + auto README index — G
- [x] BullMQ queue + worker + node-cron scheduler — G
- [x] SSRF egress guard on outbound fetches — G
- [ ] **Mount `problem` + `repo` routes** (files exist, NOT mounted → `/api/repos`, `/api/problems` dead) — G
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
- [~] `u/[username]` + `public-profile` pages — still **static mock**, not wired to the API — A

## 🔔 Notifications
- [x] Notification service + `Notification` table (emitted on sync/expiry) — A/G
- [~] Notifications API — controller/routes exist but **route NOT mounted** in web-backend — A
- [ ] Notifications UI page — A

## 📁 Repositories
- [x] Repositories page wired to `GET /api/github-repos` (web-backend) — A ✨ *new*
- [x] GitHub repo setup flow (`POST /api/github-repos`) — A
- [ ] Deep repo browsing via git-service `/repos` (blocked on route mount above) — G

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
