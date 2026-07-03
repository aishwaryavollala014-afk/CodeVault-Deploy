# 🏛️ CodeVault — Backend Development Plan

> Senior Backend Architect plan. **Planning only — no code.** Follow this top-to-bottom to go from an empty backend to production. Scope: the two backend services — **web-backend** (website API: auth, stats, profiles) and **git-service** (GitHub sync engine).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 0. Architect's summary & critique of the current design

The current decision is **3 deployables**: `web-frontend` calling **both** `web-backend` and `git-service` directly. Before the plan, three critiques you should accept or consciously reject:

1. **🔴 Browser → git-service direct call is a security liability if done naively.** The skeleton suggested an `INTERNAL_API_KEY` on git-service. **Never ship a static internal key to the browser.** Decision required:
   - **Recommended (A):** git-service authenticates the **end user's JWT** (same token web-backend issues; validated via a shared secret/JWKS). The frontend calls git-service with the *user's* bearer token, not a service key. git-service authorizes "this user may only sync their own connections".
   - **Alternative (B — BFF):** frontend talks **only** to web-backend; web-backend proxies sync requests to git-service over a private network using the internal key (key never leaves the server). Cleaner security, one origin for the browser, at the cost of a proxy hop.
   - This plan assumes **(A)** but is written so (B) is a drop-in change.

2. **🟠 Shared database vs. two databases.** Both services touch `User / Connection / Problem`. Running **two Prisma schemas over one database** invites drift and double-writes. **Recommendation:** **one database, one owning service per table** (see §3 Data Ownership). git-service reads `Connection` (owned by web-backend) but **only writes** `Problem`/`SyncRun`. Treat cross-service writes as forbidden.

3. **🟠 Session-token storage is the highest-risk asset.** Path B stores users' platform session cookies. These are bearer credentials. They must be **encrypted at rest (envelope encryption)**, never logged, never returned by any API, and rotated/expired aggressively. This shapes the whole security plan.

Everything below is sized for a solo/2-dev build that is *realistically* shippable, not over-engineered.

---

## 1. Overall Backend Architecture

### 1.1 High-level

```
                         ┌──────────────────────────────┐
                         │         web-frontend         │
                         │   (Next.js, user's browser)  │
                         └───────┬───────────────┬──────┘
                 user JWT  REST  │               │ user JWT  REST
                                 ▼               ▼
                   ┌───────────────────┐   ┌────────────────────┐
                   │    web-backend    │   │    git-service     │
                   │ auth · stats ·    │   │ submissions+code · │
                   │ connections ·     │   │ GitHub push ·      │
                   │ public profiles   │   │ README index ·     │
                   └─────┬──────┬──────┘   │ cron sync          │
                         │      │          └─────┬───────┬──────┘
            public APIs  │      │ shared DB        │       │
        (LeetCode GQL,   │      ▼                  │       ▼
         CF API, CC/HR) ─┘  ┌───────────┐          │   GitHub REST API
                            │ PostgreSQL│◀─────────┘   (push folders,
                            └───────────┘  reads Connection,  README)
                                  ▲        writes Problem/SyncRun
                            ┌───────────┐
                            │   Redis   │  (cache, rate-limit, job queue)
                            └───────────┘
```

- **web-backend** = synchronous, request/response. Owns identity & the dashboard.
- **git-service** = mostly **asynchronous / scheduled**. Owns the GitHub side-effects.
- **PostgreSQL** = single source of truth. **Redis** = cache + rate-limit + (later) job queue.

### 1.2 Request lifecycle (web-backend, e.g. `GET /stats`)

```
HTTP request
  → edge: TLS, CORS, body size limit
  → middleware: request-id, structured logger, rate-limit
  → auth middleware: verify JWT → attach req.user (401 if invalid)
  → route → controller (parse/validate input via schema)
  → service (business logic) → integration (platform API) / repository (DB)
  → cache read/write (Redis) where applicable
  → response shaper (consistent envelope)
  → error middleware (last): map typed errors → status + safe JSON
  → access log line emitted
```

### 1.3 Layered architecture (both services)

```
Route        → URL ↔ handler wiring only. No logic.
Controller   → HTTP I/O: validate input, call service, shape response. Never touches DB.
Service      → business logic + orchestration. The only layer that crosses boundaries.
Integration  → external systems (platform APIs, GitHub). One file per system.
Repository   → DB access (Prisma). The only layer that touches the database.
Cross-cutting→ config, logger, errors, validators, middlewares, jobs, types, utils.
```

> **Rule:** dependencies point downward only. A controller may not import a repository; a service may not import another service's repository.

### 1.4 Module interaction map

```
web-backend.auth ──issues JWT──▶ used by web-backend.* AND git-service.*
web-backend.connections ──owns Connection rows──▶ read by git-service.sync
git-service.sync ──writes Problem/SyncRun──▶ read by web-backend.stats (sync badges)
web-backend.stats ──reads platform public APIs──▶ (no dependency on git-service)
git-service.sync ──reads Connection.sessionToken (decrypt)──▶ platform authed APIs ──▶ GitHub
```

### 1.5 Scalability considerations

| Concern | Approach |
|---|---|
| Stateless services | No in-memory session; JWT + Redis. Horizontal scale behind a load balancer. |
| Sync is bursty/slow | Move Path B work to a **queue + workers** (git-service), not request threads. |
| Upstream rate limits | Per-platform throttling + backoff; cache public stats in Redis (TTL). |
| Cron at scale | Single scheduler enqueues jobs; **N workers** consume. Avoid duplicate runs with a lock. |
| DB hot rows | Index on `(userId, platform)`, `(userId, platform, slug)`. Read replicas later if needed. |
| Independent scaling | web-backend scales with web traffic; git-service scales with sync volume — separate deployables already enable this. |

---

## 2. Feature Breakdown (modules)

Legend — **Priority:** P0 (MVP) · P1 · P2. **Complexity:** S/M/L.

### web-backend

| # | Module | Purpose | Responsibilities | Depends on | Pri | Cx |
|---|--------|---------|------------------|-----------|-----|----|
| 1 | **Platform / Config** | Boot & config | Env validation, DB/Redis clients, logger, error classes | — | P0 | S |
| 2 | **Auth** | Identity | GitHub OAuth, issue/verify JWT, sessions, logout | 1 | P0 | M |
| 3 | **User** | Profile | Read/update user, account settings | 1,2 | P0 | S |
| 4 | **Connections** | Linked platforms | Add/list/remove handles; store (encrypted) sync tokens | 1,2 | P0 | M |
| 5 | **Platform-stats integrations** | Path A | Fetch public stats per platform (LC/CF/CC/HR) | 1 | P0 | L |
| 6 | **Stats / Aggregation** | Dashboard data | Merge per-platform stats into unified analytics | 4,5 | P0 | M |
| 7 | **Public Profile** | Shareable page data | No-auth aggregated analysis by username, cached | 5,6 | P1 | S |
| 8 | **Sync proxy/status (read)** | Surface sync state | Read `Problem/SyncRun` for dashboard badges; (option B) proxy sync triggers | 4 | P1 | S |
| 9 | **Notifications** | User alerts | Persist + list notifications (sync done, expiry) | 2 | P2 | S |

### git-service

| # | Module | Purpose | Responsibilities | Depends on | Pri | Cx |
|---|--------|---------|------------------|-----------|-----|----|
| 10 | **Platform / Config** | Boot & config | Env, DB/Redis, logger, errors, GitHub client config | — | P0 | S |
| 11 | **Auth (verify)** | Trust the caller | Validate user JWT (option A) or internal key (option B) | 10 | P0 | S |
| 12 | **Submission integrations** | Path B fetch | Authed fetch of accepted submissions + source + question | 10 | P0 | L |
| 13 | **GitHub** | Publish | Ensure repo, write `<num>/question.md` + `solution.<ext>`, commit | 10 | P0 | M |
| 14 | **README generator** | Index | Regenerate repo index table after each run | 13 | P0 | S |
| 15 | **Sync orchestrator** | The engine | Diff new vs synced, organize, push, update DB, handle expiry | 12,13,14 | P0 | L |
| 16 | **Scheduler / Jobs** | Automation | Cron → enqueue per-connection sync; workers; locks | 15 | P0 | M |
| 17 | **Sync API** | Manual trigger | `trigger`, `status` endpoints for the dashboard | 11,15 | P1 | S |

### Estimated development order

```
1 → 2 → 3 → 4 → 5 → 6 → 7        (web-backend MVP)
10 → 11 → 13 → 14 → 12 → 15 → 16 → 17   (git-service MVP)
then 8 → 9 (web-backend P1/P2)
```

> Build GitHub publish (13/14) before submission fetch (12): you can test pushing with mock solutions before fighting platform auth.

---

## 3. Database Planning (entities, no SQL)

### 3.1 Entities

| Entity | Meaning |
|--------|---------|
| **User** | An authenticated account (1:1 with a GitHub identity). |
| **Connection** | A user's link to one platform: handle + optional encrypted sync token + status. |
| **Problem** | One solved problem tracked for sync (number, slug, difficulty, language, sync state). |
| **SyncRun** | One execution of a sync (per connection): counts, status, started/finished, error. |
| **GithubRepo** | Mapping of a platform → target repo + settings (visibility, folder convention). |
| **Notification** | A user-facing event (sync done, session expired, badge earned). |
| **AuthSession** *(optional)* | Refresh-token/session record if not using stateless-only JWT. |
| **AuditLog** *(P2)* | Security-relevant events (connect, disconnect, token refresh, deletes). |

### 3.2 Relationships

```
User 1───* Connection 1───* Problem
User 1───* GithubRepo
User 1───* SyncRun           Connection 1───* SyncRun
User 1───* Notification
User 1───* AuthSession
```

- `Connection` unique on **(userId, platform)**.
- `Problem` unique on **(userId, platform, slug)** — idempotent re-sync.
- `GithubRepo` unique on **(userId, platform)**.

### 3.3 Required tables (logical)

`users`, `connections`, `problems`, `sync_runs`, `github_repos`, `notifications`, `auth_sessions?`, `audit_logs?`.

### 3.4 Data ownership (critical for the 2-service split)

| Table | Owner (writes) | Reader (read-only) |
|-------|----------------|--------------------|
| users | web-backend | git-service |
| connections | web-backend | git-service |
| github_repos | web-backend | git-service |
| problems | **git-service** | web-backend |
| sync_runs | **git-service** | web-backend |
| notifications | both (append-only) | both |
| audit_logs | both (append-only) | — |

> **Hard rule:** a service must never UPDATE a table it doesn't own. Cross-service writes go through the owning service's API or are append-only events.

### 3.5 Future extensibility

- New platform = new `platform` enum value + one integration file. **No schema change.**
- `Problem.metadata` (JSON) for platform-specific extras (rating, tags) without migrations.
- `User.plan` field reserved now (even while Pricing is deferred) to avoid a later migration.
- Soft-delete columns (`deletedAt`) on `User`/`Connection` for safe account deletion + GDPR.

### 3.6 Design considerations

- Store **timestamps in UTC**; convert at the edge.
- `sessionToken` column = encrypted blob + `tokenStatus` (active/expired) + `tokenExpiresAt` (best-effort).
- Keep `Problem` lean; large blobs (code) live in GitHub, not the DB.
- Add `lastSyncedAt` on `Connection` for cheap "stale?" checks.

---

## 4. API Planning (no endpoints written)

### 4.1 APIs each module needs (capabilities, not routes)

**web-backend**
- Auth: start OAuth, OAuth callback, current session, logout, token refresh.
- User: get me, update settings, delete account.
- Connections: add platform, list, remove, (re)authorize sync.
- Stats: aggregated dashboard stats (auth).
- Public profile: aggregated analysis by username (no auth).
- Sync (read): status/summary for dashboard; (option B) proxy "trigger sync".
- Notifications: list, mark read.

**git-service**
- Sync: trigger sync (for a user/connection), sync status.
- (internal) health/readiness for orchestration.

### 4.2 Inter-module communication

```
frontend → web-backend:   auth, user, connections, stats, public, notifications
frontend → git-service:   sync trigger + status            (option A)
git-service → DB:         read connections/repos, write problems/sync_runs
git-service → platforms:  authed submission/code/question fetch
git-service → GitHub:     push files + README
web-backend → platforms:  public stats fetch (Path A)
web-backend → git-service:(option B only) proxy trigger over private network
```

### 4.3 Auth requirements per surface

| Surface | Auth |
|--------|------|
| OAuth start/callback | none (public, CSRF-protected) |
| User, Connections, Stats, Notifications | **protected** (user JWT) |
| Public profile by username | **public**, rate-limited, cached |
| git-service sync trigger/status | **protected** (user JWT, scoped to own data) |
| git-service internal/health | private network / internal only |

### 4.4 Public vs protected

- **Public:** landing data (none needed server-side), `GET public profile`, OAuth endpoints, health.
- **Protected:** everything tied to a specific user's private data and any sync trigger.

### 4.5 Data flow (frontend ↔ backend)

```
Dashboard load:  FE → web-backend GET stats (JWT) → cache/aggregate → JSON
Public profile:  visitor → web-backend GET /public/:username → cache → JSON (no auth)
Connect stats:   FE → web-backend add connection → confirm
Authorize sync:  FE → web-backend store encrypted token → FE → git-service trigger (JWT)
Auto sync:       git-service cron → worker → fetch → push → write Problem/SyncRun → notify
Sync status:     FE → git-service GET status (JWT) OR web-backend reads sync_runs
```

---

## 5. Authentication Strategy

### 5.1 User authentication flow (GitHub OAuth — no passwords)

```
1. FE → web-backend: start OAuth (state param, PKCE if supported)
2. web-backend → GitHub: redirect with scopes (repo write, read user/email)
3. GitHub → web-backend: callback with code + state (validate state = anti-CSRF)
4. web-backend: exchange code → GitHub access token; fetch profile
5. web-backend: upsert User; store GitHub token (encrypted) for repo pushes
6. web-backend: issue app session = short-lived access JWT + refresh token
7. FE stores token (httpOnly cookie preferred over localStorage)
```

> Passwordless email "magic link" (shown in the prototype) is **optional/secondary**; if kept, it must be a one-time signed link, never a stored password.

### 5.2 Authorization model

- **Resource ownership** is the core rule: every protected request resolves `req.user.id`; a user may only read/write rows where `userId === req.user.id`.
- **Roles (lightweight):** `user` (default), `admin` (internal ops/support). No complex RBAC needed yet — keep a role field for future.
- git-service authorizes by **the same ownership rule** using the validated JWT.

### 5.3 Session / token lifecycle

| Token | Lifetime | Storage | Rotation |
|-------|----------|---------|----------|
| Access JWT | 15–30 min | httpOnly cookie | re-minted via refresh |
| Refresh token | 7–30 days | httpOnly cookie + DB (`auth_sessions`) | rotate on use; revoke on logout |
| GitHub token | long-lived | DB, encrypted | refresh per GitHub policy |
| Platform sync token | days–weeks (expires) | DB, encrypted | user re-connects when expired |

- **Logout** revokes the refresh token (and clears cookies).
- **Expiry handling:** platform token expiry is expected → mark `Connection.tokenStatus = expired`, emit notification, surface "Reconnect". Stats (Path A) keep working.

### 5.4 Role hierarchy

```
admin  → all support/ops capabilities (read-only on user data by default)
user   → own data only
(public/anonymous) → public profile + marketing only
```

### 5.5 Account security features

- OAuth state + PKCE; strict redirect URI allowlist.
- Encrypted-at-rest secrets (GitHub + platform tokens) via envelope encryption (KMS/master key).
- Refresh-token rotation + reuse detection (revoke family on reuse).
- Rate-limit auth endpoints; lockout/backoff on abuse.
- "Connected apps / sessions" view + revoke; "disconnect all"; account deletion (soft → purge).
- Audit log for connect/disconnect/token refresh/delete.

---

## 6. Backend Folder Organization (per service)

Both services share the same shape (already scaffolded). Purpose of each layer:

```
<service>/
├── prisma/                 # schema + migrations (DB definition)
├── src/
│   ├── index.ts            # entry: load config, start server (+ scheduler in git-service)
│   ├── app.ts              # build app: middlewares + routes + error handler
│   ├── server.ts           # http listen + graceful shutdown
│   ├── config/             # env validation, db/redis/github config (fail-fast)
│   ├── routes/             # URL → controller wiring ONLY
│   ├── controllers/        # HTTP I/O: validate, call service, shape response
│   ├── services/           # business logic & orchestration
│   │   ├── platforms/      # (web-backend) public stats integrations, one file/platform
│   │   ├── submissions/    # (git-service) authed code/question fetch, one file/platform
│   │   └── github/         # (git-service) publish + readme generator
│   ├── repositories/       # DB access (Prisma) — only layer touching the DB
│   ├── middlewares/        # auth, error, rate-limit, validate, request-id/logging
│   ├── jobs/               # (git-service) scheduler + workers
│   ├── lib/                # prisma, redis, logger, httpClient, crypto(encryption)
│   ├── validators/         # input schemas (Zod)
│   ├── types/              # shared types/DTOs
│   └── utils/              # pure helpers (slugify, pad number, ext map, errors)
└── tests/                  # unit + integration
```

> **Add a `repositories/` layer** (not in the original skeleton) so services never call Prisma directly — this is the single biggest maintainability win and makes testing trivial via mock repos.

---

## 7. Development Roadmap (empty → production)

> Each phase ends in something runnable/verifiable. Rationale = why it precedes the next.

**Phase 0 — Foundations (both services)**
Config + env validation, DB/Redis/logger clients, error classes, base middlewares, health endpoints, CI lint/test, migrations baseline.
*Why first:* nothing can be built or tested without config, DB access, and consistent errors.

**Phase 1 — Identity (web-backend)**
GitHub OAuth, JWT issue/verify, refresh + logout, `User`, ownership middleware.
*Why next:* every protected feature needs a `req.user`. JWT format must be fixed before git-service can trust it.

**Phase 2 — Connections + Path A stats (web-backend)**
Add/list/remove connections; one platform integration at a time (LeetCode → Codeforces → CodeChef → HackerRank); stats aggregation; caching.
*Why:* the dashboard's core value works from username alone, independent of the risky sync path.

**Phase 3 — Public profile (web-backend)**
No-auth aggregated profile, cached + rate-limited.
*Why:* reuses Phase 2 aggregation; low risk; high product value.

**Phase 4 — GitHub publish (git-service)**
JWT verify, GitHub client, folder writer, README generator — proven with mock solutions.
*Why:* validates the output side before the hard input side (platform auth).

**Phase 5 — Path B fetch + orchestrator (git-service)**
Authed submission/code/question fetch (LeetCode first); diff; push; write `Problem/SyncRun`; expiry handling.
*Why:* depends on Phase 4 (publish) and Phase 1 (JWT) and Phase 2 (Connection rows).

**Phase 6 — Automation (git-service)**
Scheduler → queue → workers, idempotency locks, retries/backoff, manual trigger + status API.
*Why:* only automate once a single sync is correct and idempotent.

**Phase 7 — Notifications + sync badges (web-backend)**
Persist/list notifications; dashboard reads `sync_runs`.
*Why:* depends on git-service emitting events.

**Phase 8 — Hardening & deploy**
Security pass, load/perf test, observability, runbooks, secrets management, staging → production.
*Why:* you harden a feature-complete system, not a moving target.

---

## 8. Dependencies Between Features (blockers)

```
Config/DB (P0) ─┬─▶ Auth/JWT ─┬─▶ Connections ─┬─▶ Stats ─▶ Public profile
                │             │                └─▶ (token) ─▶ git-service sync
                │             └─▶ everything protected
GitHub publish ─┴─▶ Sync orchestrator ─▶ Scheduler/jobs ─▶ Sync status/badges ─▶ Notifications
```

**Hard blockers (must finish first):**
- **JWT contract** blocks *all* protected work in both services. Freeze its claims early.
- **Connection model + token encryption** blocks git-service entirely.
- **GitHub publish** blocks the orchestrator.
- **Idempotent diff (Problem uniqueness)** blocks safe automation (or you double-push).
- **Data-ownership rules** block any cross-service write — agree before coding.

---

## 9. Security Plan (incorporate throughout — do not implement here)

- **Transport:** HTTPS everywhere; HSTS; secure cookies (httpOnly, SameSite).
- **AuthN/Z:** OAuth state + PKCE; redirect allowlist; JWT verification on every protected route; strict resource-ownership checks (no IDOR).
- **Secrets at rest:** envelope-encrypt GitHub + platform tokens; master key in KMS/secret manager; never in `.env` in prod.
- **Secrets in transit/logs:** never log tokens, cookies, auth headers, or code bodies; redact PII.
- **Input:** validate & sanitize all input at the edge (schemas); reject unknown fields; size limits.
- **Rate limiting:** per-IP and per-user; stricter on auth + public profile + sync trigger.
- **CORS:** explicit origin allowlist; no wildcard with credentials.
- **Dependencies:** lockfiles, `npm audit`/Dependabot, pin versions.
- **GitHub scope minimization:** request least privilege; per-repo where possible.
- **Abuse:** only the user's own data is ever fetched; enforce ownership in git-service too.
- **Headers:** security headers (CSP for any served HTML, X-Content-Type-Options, etc.).
- **Secrets rotation & revocation:** refresh-token rotation + reuse detection; "revoke all sessions".
- **Data lifecycle:** soft-delete → scheduled purge; export/delete for GDPR.

---

## 10. Performance Plan

| Area | Technique |
|------|-----------|
| **Caching** | Redis cache for public stats + public profiles (TTL ~5–15 min); cache GitHub repo metadata. |
| **Indexing** | `connections(userId,platform)`, `problems(userId,platform,slug)`, `sync_runs(connectionId,startedAt)`, `users(githubLogin)`. |
| **Pagination** | Cursor-based for problems list, notifications, activity log, repo file lists. |
| **Queues** | Path B sync → job queue (BullMQ/Redis). Never run sync on a request thread. |
| **Background jobs** | Cron enqueues per-connection jobs; workers process with concurrency caps. |
| **Async processing** | GitHub pushes + platform fetches are I/O-bound → async with backoff + retry. |
| **Rate-limit friendliness** | Per-platform throttle + jitter; respect upstream `Retry-After`; cache to cut calls. |
| **Idempotency** | Diff against `Problem` before push; dedupe jobs with a per-connection lock. |
| **Payloads** | Return only what the dashboard needs; avoid N+1 via repository batch reads. |
| **Cold data** | Solution code stays in GitHub, not the DB — keeps tables small/fast. |

---

## 11. Error Handling Strategy

- **Typed error hierarchy:** `AppError(base, statusCode, code)` → `ValidationError(400)`, `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`, `RateLimitError(429)`, `UpstreamError(502)`, `ExpiredSessionError(409, domain)`, `InternalError(500)`.
- **One central error middleware** maps errors → consistent JSON envelope:
  `{ error: { code, message, requestId, details? } }` — never leak stack traces or secrets in prod.
- **Categories:** client (4xx, expected) vs server (5xx, alert) vs upstream (platform/GitHub) vs domain (expired session → user action).
- **Upstream failures:** wrap platform/GitHub errors in `UpstreamError`; retry transient (5xx/timeouts) with backoff; surface a clean message.
- **Validation:** all at the edge via schemas; return field-level `details`.
- **Correlation:** every response + log carries a `requestId`; jobs carry a `jobId`.
- **Expected domain states** (expired token, not-found profile) are **not** error-logged as errors — they're normal flows.

---

## 12. Logging & Monitoring Plan

**Logging (structured JSON, pino):**
- Per request: method, path, status, latency, `requestId`, `userId` (never tokens/PII).
- Per job: `jobId`, connection, items fetched/pushed, duration, outcome.
- Levels: `error` (5xx/unexpected), `warn` (expiry, retries, rate-limit), `info` (lifecycle), `debug` (dev only).

**Monitoring / metrics:**
- Health: `/health` (liveness), `/ready` (DB/Redis reachable).
- Metrics: request rate/latency/error-rate; queue depth; job success/fail; sync throughput; upstream error rate; cache hit ratio.
- Alerts: 5xx spike, queue backlog growth, sync failure rate, DB connection saturation, token-decrypt failures.

**Auditing (security):**
- Append-only `audit_logs`: connect/disconnect, token refresh, repo config change, account delete, admin actions.

**Dev vs prod:**
- Dev: pretty logs, `debug` on, verbose errors.
- Prod: JSON logs to aggregator (e.g. Logtail/Datadog/CloudWatch), `info`+, sampled traces, no PII.

---

## 13. Deployment Readiness Checklist

*(Implementation status — ticked = built/verified in code. Unticked = deploy/CI-time or pending.)*

**Code & tests**
- [ ] Unit + integration tests on services, repos, generators; CI green *(verified manually; automated suites + CI pending)*
- [x] Lint + typecheck enforced in CI *(.github/workflows/ci.yml)*
- [x] No `TODO`/secrets/`console.log` in shipped code *(only intentional console.error in env fail-fast)*

**Config & secrets**
- [x] All env vars validated at boot; app fails fast if missing
- [ ] Secrets in a manager (not `.env`); master encryption key provisioned *(deploy-time)*
- [ ] Separate config for dev / staging / prod *(dev only so far)*

**Data**
- [x] Migrations reproducible & reversible *(committed; deploy automation pending)*
- [ ] Indexes in place; seed/admin bootstrap documented *(indexes done; seed/bootstrap not documented)*
- [ ] Backups + restore tested; retention defined *(deploy-time)*

**Security**
- [ ] HTTPS/HSTS, secure cookies, CORS allowlist, security headers *(secure cookies + CORS + helmet done; HTTPS/HSTS deploy-time)*
- [x] Rate limits on auth/public/sync; OAuth state+redirect allowlist
- [x] Token encryption verified; nothing sensitive in logs
- [ ] `npm audit` clean / triaged *(not run in CI yet)*

**Reliability**
- [x] Health + readiness probes; graceful shutdown (drain jobs)
- [x] Retries/backoff + idempotency on sync; per-connection locks
- [x] Error middleware returns safe envelopes everywhere

**Observability**
- [ ] Structured logs shipped; dashboards + alerts wired *(structured+redacted logs done; shipping/dashboards/alerts deploy-time)*
- [x] `requestId`/`jobId` correlation end-to-end

**Ops**
- [ ] Runbooks (token expiry storm, GitHub outage, queue backlog) *(documented in OBSERVABILITY_PLAN; not operationalized)*
- [ ] Rollback plan; staging mirrors prod *(deploy-time)*
- [ ] Load test of stats + a sync batch passed *(pending)*

---

## 14. Git Workflow (frontend + backend in parallel, 2 devs)

### 14.1 Branch strategy — trunk-based with short-lived branches
```
main (protected, always deployable)
  ├─ feat/be-auth-oauth         (backend dev)
  ├─ feat/be-stats-leetcode
  ├─ feat/fe-dashboard          (frontend dev)
  └─ fix/be-sync-idempotency
```
- One branch per feature/fix; **merge within 1–2 days**; rebase on `main` before PR.
- Protect `main`: PR + 1 review + green CI required.

### 14.2 Avoiding merge conflicts (the parallel-dev win)
- **Folder isolation:** backend lives in `web-backend/`, `git-service/`; frontend in `web-frontend/`. Two devs rarely touch the same files.
- **Contract-first:** agree the **API contract** (request/response shapes, auth) up front in a shared doc (e.g. `docs/API_CONTRACT.md` or OpenAPI). Both code against the contract; the frontend mocks it until the backend lands.
- Keep PRs small; pull `main` frequently; never reformat unrelated files.
- Shared types: publish DTO types from a single source the FE can consume (or a generated client).

### 14.3 Commit conventions (Conventional Commits)
```
feat(be-auth): add github oauth callback handling
fix(git-service): make sync idempotent on retry
chore(be): add request-id middleware
docs: update API contract for /stats
```
Scopes: `be-*`, `git-service`, `fe-*`, `docs`, `chore`. **Author = you only, no co-author trailer** (project rule).

### 14.4 When to merge
- Merge to `main` when: CI green, reviewed, behind a feature flag if incomplete, contract honored.
- **Don't** merge a half-finished endpoint that breaks the agreed contract — flag it.

### 14.5 Coordinating backend ↔ frontend
- The **API contract is the interface**; change it via PR + notify the other dev.
- Frontend builds against mocks → swaps to real endpoints when the backend PR merges.
- Version/announce breaking changes; keep a short `CHANGELOG`/contract diff.
- Use staging: FE points at deployed staging backend for integration before prod.

---

## 15. Milestones

| Milestone | Goal | Expected outcome | Dependencies | Completion criteria |
|----------|------|------------------|--------------|---------------------|
| **M1 — Foundations** | Runnable services | Both boot, `/health` green, CI, migrations | — | Services start in CI + locally; health checks pass |
| **M2 — Auth** | Users can sign in | GitHub OAuth → JWT → `/me` | M1 | Login flow works end-to-end; protected route rejects no-token |
| **M3 — Stats (Path A)** | Dashboard data | LC+CF+CC+HR public stats aggregated + cached | M2 | `/stats` returns correct unified numbers; cache hit verified |
| **M4 — Public profile** | Shareable page | No-auth `/public/:username` | M3 | Visitor sees aggregated profile; rate-limited |
| **M5 — GitHub publish** | Push solutions | Folder + README written to a repo | M2 | Mock solution lands in GitHub correctly + index updates |
| **M6 — Sync (Path B)** | Auto code sync | LeetCode authed fetch → push → DB | M5, M3 | New accepted problem appears in repo; idempotent re-run |
| **M7 — Automation** | Hands-off | Cron + queue + workers + status API | M6 | Scheduled sync runs; manual trigger + status work; locks hold |
| **M8 — Notifications** | User feedback | Events persisted + surfaced | M7 | Sync/expiry notifications visible in dashboard |
| **M9 — Production** | Ship | Hardened, observable, deployed | M1–M8 | Deployment checklist (§13) fully satisfied on staging→prod |

---

## 16. Risks & Mitigations

| # | Risk | Type | Impact | Mitigation |
|---|------|------|--------|-----------|
| R1 | Internal key shipped to browser (frontend→git-service) | Security | Critical | Use **user JWT** (option A) or **BFF proxy** (option B); never a static key in the client |
| R2 | Platform session tokens leak | Security | Critical | Envelope encryption, never log/return, short TTL, rotate, audit |
| R3 | Two schemas drift over one DB | Architecture | High | Single owner per table; `repositories/` layer; cross-service writes forbidden |
| R4 | LeetCode/CF change APIs or block scraping | Reliability | High | Isolate per-platform adapters; circuit-break + cache; degrade to last-known stats; alert |
| R5 | Sync non-idempotent → duplicate pushes/commits | Correctness | High | Diff on `Problem` uniqueness; per-connection lock; dry-run tests |
| R6 | Token-expiry "storms" (many reconnects) | UX/Reliability | Medium | Graceful expiry state; batch notify; stats unaffected; backoff |
| R7 | Upstream rate limits throttle sync | Performance | Medium | Throttle + jitter + `Retry-After`; queue concurrency caps; cache |
| R8 | FE/BE contract drift | Collaboration | Medium | Contract-first doc/OpenAPI; mocks; PR-gated changes; staging integration |
| R9 | GitHub outage blocks sync | Reliability | Medium | Retry/backoff, queue persistence, resume on recovery, status surfaced |
| R10 | Scope creep (pricing, AI, gamification) | Delivery | Medium | Strict P0/P1/P2; pricing already deferred; flags for incomplete work |
| R11 | Secrets/PII in logs | Security/Compliance | High | Redaction middleware; log review in PR; no token/code logging |
| R12 | Account deletion incomplete (orphans) | Compliance | Medium | Soft-delete → cascading purge job; verify no orphaned tokens/rows |

---

## ✅ Architect's recommendations to lock before coding

1. **Pick option A (user-JWT to git-service) or B (BFF proxy)** — don't ship a browser-side internal key. *(Recommend A; B if you want one browser origin.)*
2. **One database, strict per-table ownership**, and add a **`repositories/` layer**.
3. **Freeze the JWT claim contract + the FE/BE API contract first** — they unblock everyone.
4. **Encrypt platform/GitHub tokens from day one** — retrofitting crypto is painful.
5. **Build publish (M5) before fetch (M6)**; automate (M7) only after one idempotent sync works.
6. Keep `User.plan` reserved now so deferred **Pricing** needs no migration later.

> Next step when you're ready: I can turn any single phase/milestone into a detailed task checklist (still no code), or draft the **API contract** doc the two of you will build against.

---

# 15. Implemented backend reference (captured before skeleton reset — 2026-06-27)

> Both backends were built/tested, then reset to empty skeletons. This section preserves the **interface of every source file** (exports, signatures, routes, key constants/logic) so each service can be rebuilt 1:1. Full source remains in git history. Schema is in [DATABASE_PLAN.md](DATABASE_PLAN.md) §17; endpoints in [API_CONTRACT.md](API_CONTRACT.md); auth detail in [AUTH_SECURITY.md](AUTH_SECURITY.md); platform fetchers in [PLATFORM_INTEGRATION.md](PLATFORM_INTEGRATION.md). Stack (both): Express 4.19 + Prisma 5.18 + Zod + pino + ioredis, `@/`→`src/`, layered Route→Controller→Service→lib.

## 15.1 web-backend (`web-backend/src/`)

**Entry/config:** `index.ts` boots; `app.ts` → `createApp(): Application` (helmet, cors, json, requestId, pino-http, `/api` router, health routes, notFound + errorHandler last); `server.ts` → `startServer(): Server` (graceful shutdown). `config/env.ts` Zod `envSchema` → typed `env`, `isProd`, `isDev` (fail-fast). `config/index.ts` barrel. `config/database.ts`, `config/redis.ts` thin.

**lib:** `crypto.ts` — AES-256-GCM (`ALGORITHM`, IV 12B, TAG 16B, `loadKey()` from `ENCRYPTION_KEY`); `encrypt(plaintext): EncryptedBlob{cipher,iv}`, `decrypt(cipher,iv): string`, `sha256(v)`, `randomToken(bytes=40)`. `jwt.ts` — `signAccessToken(user): string` (HS256, ~30min), `verifyAccessToken(token): JwtClaims`. `prisma.ts`/`redis.ts` global singletons. `httpClient.ts` axios instance. `logger.ts` pino (redaction).

**middlewares:** `auth.middleware.ts` — `ACCESS_COOKIE='cv_access'`, `REFRESH_COOKIE='cv_refresh'`, `requireAuth` (cookie/Bearer→verify→`req.user`), `requireAdmin`. `error.middleware.ts` — `notFoundHandler`, `errorHandler` (maps AppError→status, consistent JSON). `rateLimit.middleware.ts` — `rateLimit({windowSec,max,keyPrefix})` (Redis). `requestId.middleware.ts`, `validate.middleware.ts` — `validateBody/Query/Params(schema)`.

**routes** (all mounted under `/api` in `routes/index.ts`): `/auth` (`/github/start`,`/github/callback`,`/session`,`/refresh`,`/logout`; authLimit 20/300s), `/users` (`/me` GET/PATCH/DELETE, requireAuth), `/platforms` (`/`,`/connect`,`/:id/authorize`,`DELETE /:id`), `/stats` (`/`,`/recent`), `/public` (`/:username` no-auth), `/settings` (`/` GET/PATCH), `/github` (`/repos`,`PATCH /repos/:platform`), `/notifications` (`/`,`/read`). `health.routes.ts` → `/health`,`/ready`.

**controllers** (thin HTTP I/O): `auth` (startGithub, githubCallback, session, refresh, logout + `setAuthCookies`/`clearAuthCookies`), `user` (getMe, updateMe, deleteMe), `platform` (list, connect, authorize, remove), `stats` (getStats, getRecent), `public` (getProfile), `settings` (getSettings, updateSettings), `githubRepo` (list, update), `notification` (list, markRead), `health`.

**services:**
- `auth.service.ts` — GitHub OAuth: `createGithubAuthUrl(next?)` (state in Redis `oauth:state:` TTL 600s), `handleGithubCallback(...)` (validate state→exchange code→fetch profile/emails→upsert user→encrypt GH token→issue session), `refreshSession(rawRefresh)` (rotation + reuse→family revoke), `logout(rawRefresh)`, internal `issueSession`, `uniqueHandle`.
- `connection.service.ts` — `listConnections`, `createConnection` (unique userId+platform→Conflict), `authorizeSync` (encrypt+store session token, set tokenStatus), `removeConnection`. `ConnectionDto`.
- `stats.service.ts` — `getAggregatedStats(userId)` (per-platform cache `stats:{userId}:{platform}` TTL 600s, merge difficulty/topics/languages/totals), `getRecentSubmissions`, `invalidateUserStats`, `fetchPlatform`.
- `public.service.ts` — `getPublicProfile(handle)` cache `public:{handle}` TTL 900s (enumeration/scraping defense).
- `settings.service.ts` — `getSettings`, `updateSettings`, `withDefaults`. `user.service.ts` — `getMe`, `updateMe` (allowlist fields), `deleteMe` (soft-delete + purge tokens). `notification.service.ts` — `listNotifications`, `markRead`, `createNotification`. `githubRepo.service.ts` — `listRepoMappings`, `upsertRepoMapping`.
- `services/platforms/` (Path A stats, one file/platform): `index.ts` registry `getStatsProvider(platform)`; `leetcode` (GraphQL `leetcode.com/graphql`), `codeforces` (`api/user.info`+`user.status`), `codechef`, `hackerrank` (public profile). Interface `PlatformStatsProvider`.

**types:** `index.ts` — `JwtClaims`, `AuthUser`, `PlatformName`, `PLATFORMS`, `AggregatedStats`, `SubmissionSummary`, `PublicProfile`, `AppSettings`+`DEFAULT_SETTINGS`, `RepoMappingDto`, `NotificationDto`, `ApiErrorBody`, `Paginated<T>`, health/readiness. `platform.types.ts` — `PlatformStats`, `PlatformStatsProvider`. `express.d.ts` augments `req.user`.

**utils:** `errors.ts` — `AppError` + `ValidationError`/`Unauthenticated`/`Forbidden`/`NotFound`/`Conflict`/`SessionExpired`/`RateLimit`/`Upstream`/`Internal`. `helpers.ts` — `asyncHandler`, `toHandle(login)`. **validators (Zod):** `auth` (githubStart/Callback), `platform` (createConnection/authorizeSync/params; username `/^[A-Za-z0-9_.-]{1,39}$/`), `settings` (updateSettings/repoMapping), `user` (updateUser).

## 15.2 git-service (`git-service/src/`)

**Entry/config:** `index.ts` boots + starts scheduler + sync worker; `app.ts` → `createApp()`; `server.ts` → `startServer()`. `config/env.ts` Zod env. Shares the same middleware/lib shapes as web-backend, plus:

**lib (extra):** `crypto.ts` — **decrypt-only** (`decrypt(cipher,iv)`; reads same `ENCRYPTION_KEY`). `egress.ts` — SSRF allowlist `ALLOWED_HOSTS`, `assertAllowedUrl(url)`, `egressInterceptor` (axios). `github.ts` — `githubApi(token): AxiosInstance` (GitHub REST). `redis.ts` adds `bullConnection` for BullMQ. `auth.middleware.ts` — `requireAuth` verifies the **same JWT** (S1), cookie `cv_access`.

**routes** (`/api`): `/sync` (`POST /` trigger, `GET /status`, `GET /activity`; requireAuth), `/repos` (`/`, `/:platform/files`, `/:platform/commits`), `/problems` (`/:platform/:number`). `health` → `/health`,`/ready`.

**controllers:** `sync` (trigger→enqueue, status, activity), `repo` (list, files, commits), `problem` (getProblem), `health`.

**jobs (BullMQ):** `queue.ts` — `SyncJobData`, `SYNC_QUEUE='sync'`, `syncQueue`, `enqueueSync(data)`. `scheduler.ts` — `startScheduler()` (node-cron periodic enqueue). `sync.job.ts` — `startSyncWorker(): Worker` (concurrency-capped).

**services:**
- `sync.service.ts` — orchestrator: `runSync(...)` under Redis lock `lock:sync:{connectionId}` (TTL 1800s) + per-platform semaphore `sema:platform:{platform}` (`acquire/releasePlatformSlot`); `publish` (push via github.service), `persist` (upsert problems/sync_runs), `finishRun`, `onExpired` (flag expired session). `SyncResult`.
- `services/github/github.service.ts` — `verifyRepoAccess(token,repo)` (ownership), `pushFiles(...)` (Git Data API batch), `readFile(...)`, `listCommits(...)`, `splitRepo`. `readme.generator.ts` — `generateReadme(repoName, entries): string` (index table).
- `services/submissions/` (Path B fetchers, one/platform): `index.ts` `getSubmissionAdapter(platform)`; `leetcode` (authed GraphQL, `authHeaders`, `mapDifficulty`), `codeforces`, `codechef`, `hackerrank`. Interface `SubmissionAdapter`.
- `repo.service.ts` — `listRepos`, `listFiles`, `listCommits` (`RepoInfoDto`, `RepoFileDto`). `problem.service.ts` — `getProblem` (`ProblemDetailDto`).

**types:** `sync.types.ts` — `Difficulty`, `Submission`, `Question`, `SolutionToSync`, `SubmissionAdapter`, `SyncResult`. `github.types.ts` — `GithubFile`, `RepoRef`, `CommitInfo`, `RepoFileEntry`. `index.ts` — `JwtClaims`, `AuthUser`, `PlatformName`, etc. **utils:** `errors.ts` (+`ExpiredSessionError`, `ServiceUnavailableError`); `helpers.ts` — `asyncHandler`, `padNumber(num,4)`, `slugify`, `langToExt` (`LANG_EXT` map). **validators:** `sync` (triggerSync, platformParams, problemParams, listQuery).

> Rebuild order: schema (DATABASE_PLAN §17) → config/lib → types/utils/validators → middlewares → services → controllers → routes → entry. Same for both services; git-service adds jobs + github + submissions + egress.
