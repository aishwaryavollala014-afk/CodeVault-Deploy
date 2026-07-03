# 🤝 CodeVault — Frontend ↔ Backend Contract & Execution Plan

> **Single source of truth** for both developers. **No implementation code** — interfaces, contracts, responsibilities, and execution only. Companion to [BACKEND_PLAN](BACKEND_PLAN.md), [FRONTEND_PLAN](FRONTEND_PLAN.md), [SECURITY_PLAN](SECURITY_PLAN.md).

## Conventions (read first)

- **Two services / two base URLs:** `WEB = web-backend (/api/v1)` · `GIT = git-service (/api/v1)`. The frontend calls **both**.
- **Versioning:** all routes under `/api/v1`. Breaking changes → `/v2`, never silent.
- **Auth transport:** access JWT in an **httpOnly Secure cookie** (same parent domain) **or** `Authorization: Bearer <accessToken>`. **Both** web-backend and git-service verify the same JWT (per SECURITY_PLAN). Mutations also require **`X-CSRF-Token`**.
- **Standard headers (requests):** `Content-Type: application/json`, `Authorization`/cookie, `X-CSRF-Token` (mutations), optional `X-Request-Id`.
- **Standard headers (responses):** `X-Request-Id`, rate-limit headers, security headers (SECURITY_PLAN §11).
- **Success envelope:** single resource → the object; lists → `{ items: [...], nextCursor: string|null, total?: number }`.
- **Error envelope (all errors):** `{ error: { code, message, requestId, details?: [{ field, message }] } }`.
- **Error codes:** `VALIDATION_ERROR(400)` · `UNAUTHENTICATED(401)` · `FORBIDDEN(403)` · `NOT_FOUND(404)` · `CONFLICT(409)` · `SESSION_EXPIRED(409)` · `RATE_LIMITED(429)` · `UPSTREAM_ERROR(502)` · `INTERNAL(500)`.
- **Pagination:** cursor-based — query `?cursor=&limit=` → `{ items, nextCursor }`. Filtering/sorting via explicit query params only (allowlisted).
- **Roles:** `user` (default), `admin` (internal). Unless noted, protected = `user` and **ownership-scoped** (caller may only touch their own data).
- **Platforms enum:** `leetcode | codeforces | codechef | hackerrank`.
- **IDs** are opaque strings (cuid). **Timestamps** are ISO-8601 UTC.

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

# Part 1 — API Contract (per module)

> For each endpoint: method, path, auth, roles, params, query, request model, response model, errors, validation. Request/response **models** are defined once in **Part 4** and referenced here.

### 1.1 Auth module (WEB) — *purpose:* identity via GitHub OAuth; sessions
FE: Login page, AuthProvider, Topbar. BE: OAuth exchange, JWT issue/verify, refresh, logout.

| Method | Endpoint | Auth | Req | Res | Errors | Notes |
|--------|----------|------|-----|-----|--------|-------|
| GET | `/auth/github/start` | public | — (query `next?`) | redirect to GitHub | — | Sets `state`+PKCE; redirect allowlist |
| GET | `/auth/github/callback` | public | query `code`,`state` | redirect to app + Set-Cookie | `VALIDATION`,`UNAUTHENTICATED` | Validates state (CSRF); issues JWT+refresh |
| GET | `/auth/session` | protected | — | `User` | `UNAUTHENTICATED` | Current user; FE bootstrap |
| POST | `/auth/refresh` | refresh cookie | — | new access (cookie) | `UNAUTHENTICATED` | Rotate refresh; reuse-detection |
| POST | `/auth/logout` | protected | — | `204` | — | Revoke refresh, clear cookies |

*Validation:* `state` must match; `code` present. *Public vs protected:* start/callback public (CSRF via state), rest protected.

### 1.1b Extension Auth module (WEB) — *purpose:* sign the browser extension in as the **same user**
FE: browser-extension popup. BE: PKCE OAuth handoff → JWT for a `client=extension` session; list/revoke. See [EXTENSION_PLAN.md](EXTENSION_PLAN.md) §3, [AUTH_SECURITY.md](AUTH_SECURITY.md).

| Method | Endpoint | Auth | Req | Res | Errors | Notes |
|--------|----------|------|-----|-----|--------|-------|
| POST | `/auth/extension/start` | public | `{ challenge }` (PKCE) | `{ authorizeUrl }` | `VALIDATION` | Opens via `launchWebAuthFlow`; `client=extension`; redirect allowlist |
| POST | `/auth/extension/token` | public | `{ code, verifier }` | `{ accessToken, refreshToken }` | `VALIDATION`,`UNAUTHENTICATED` | One-time code → JWT pair (same shape) |
| POST | `/auth/extension/refresh` | refresh token | `{ refreshToken }` | new pair | `UNAUTHENTICATED` | Rotate; reuse-detection; family revoke |
| GET | `/auth/extension/sessions` | protected | — | `{ items: ExtensionSession[] }` | `UNAUTHENTICATED` | List active extension sessions (userAgent/ip/lastSeen) |
| DELETE | `/auth/extension/sessions/:id` | protected | — | `204` | `FORBIDDEN`,`NOT_FOUND` | Revoke one extension session |

*Validation:* PKCE `challenge`/`verifier` required; ownership from JWT only. *Note:* extension token is **not** the website's httpOnly cookie — independently revocable; stored in `chrome.storage.local`.

### 1.2 User module (WEB) — *purpose:* profile & account
FE: Settings (Account), ProfileHeader. BE: read/update/delete user.

| Method | Endpoint | Auth | Req | Res | Errors |
|--------|----------|------|-----|-----|--------|
| GET | `/users/me` | protected | — | `User` | `UNAUTHENTICATED` |
| PATCH | `/users/me` | protected | `UpdateUser` | `User` | `VALIDATION`,`UNAUTHENTICATED` |
| DELETE | `/users/me` | protected | `{ confirm: true }` | `204` | `VALIDATION` |

*Validation/mass-assignment:* allowlist `displayName`, `handle`; **reject** `role`,`plan`,`email`,`id`. Delete purges tokens + revokes (SECURITY_PLAN).

### 1.3 Connections module (WEB) — *purpose:* linked platforms + sync authorization
FE: Connect flow, Settings (Platforms), Sync status. BE: CRUD connections, store encrypted sync token.

| Method | Endpoint | Auth | Req | Res | Errors |
|--------|----------|------|-----|-----|--------|
| GET | `/connections` | protected | — | `{ items: Connection[] }` | `UNAUTHENTICATED` |
| POST | `/connections` | protected | `CreateConnection` | `Connection` | `VALIDATION`,`CONFLICT` |
| POST | `/connections/:id/authorize` | protected | `AuthorizeSync` | `Connection` | `VALIDATION`,`FORBIDDEN`,`NOT_FOUND` |
| DELETE | `/connections/:id` | protected | — | `204` | `FORBIDDEN`,`NOT_FOUND` |

*Path param:* `id` (ownership-checked). *Validation:* `platform` ∈ enum; `username` strict regex (anti-SSRF); unique `(userId,platform)` → `CONFLICT`. *authorize* stores encrypted session token (never returned).

### 1.4 Stats module (WEB) — *purpose:* unified dashboard analytics (Path A)
FE: Overview, Analytics. BE: fetch public stats per platform, aggregate, cache.

| Method | Endpoint | Auth | Query | Res | Errors |
|--------|----------|------|-------|-----|--------|
| GET | `/stats` | protected | `platform?`, `range?` | `AggregatedStats` | `UNAUTHENTICATED`,`UPSTREAM_ERROR` |
| GET | `/stats/recent` | protected | `cursor?`,`limit?` | `{ items: SubmissionSummary[], nextCursor }` | `UNAUTHENTICATED` |

*Query allowlist:* `platform` ∈ enum|`all`; `range` ∈ `30d|6m|1y|all`. *Caching:* server caches per user/platform (TTL ~10 min). Partial-failure: return available platforms + `degraded[]` flags.

### 1.5 Public profile (WEB) — *purpose:* shareable analysis (no auth)
FE: `/u/[username]` (public). BE: aggregate **public-only** fields, cached, enumeration-hardened.

| Method | Endpoint | Auth | Path | Res | Errors |
|--------|----------|------|------|-----|--------|
| GET | `/public/:username` | **public** | `username` | `PublicProfile` | `NOT_FOUND`,`RATE_LIMITED` |

*Validation:* uniform `404` for missing/private (no enumeration oracle). **Never** returns email/tokens. Rate-limited + cached (ISR-friendly).

### 1.6 Settings/prefs (WEB) — *purpose:* sync prefs, notifications, public visibility, repo config
FE: Settings sections, Manage public profile. BE: read/update prefs; GitHub repo mapping.

| Method | Endpoint | Auth | Req | Res | Errors |
|--------|----------|------|-----|-----|--------|
| GET | `/settings` | protected | — | `Settings` | `UNAUTHENTICATED` |
| PATCH | `/settings` | protected | `UpdateSettings` | `Settings` | `VALIDATION` |
| GET | `/github/repos` | protected | — | `{ items: RepoMapping[] }` | `UNAUTHENTICATED` |
| PATCH | `/github/repos/:platform` | protected | `UpdateRepoMapping` | `RepoMapping` | `VALIDATION`,`NOT_FOUND` |

*Validation:* enums for frequency/visibility/folderConvention; boolean toggles. Field allowlist.

### 1.7 Notifications (WEB) — *purpose:* user alerts
FE: Notifications page, Topbar bell. BE: list + mark read.

| Method | Endpoint | Auth | Query | Res | Errors |
|--------|----------|------|-------|-----|--------|
| GET | `/notifications` | protected | `cursor?`,`limit?`,`unread?` | `{ items: Notification[], nextCursor }` | `UNAUTHENTICATED` |
| POST | `/notifications/read` | protected | `{ ids?: string[] }` (omit = all) | `{ updated: number }` | `VALIDATION` |

### 1.8 Sync (GIT) — *purpose:* trigger + status of code sync (Path B)
FE: Sync status, Connect (authorize), Repositories ("Re-sync"). BE(git-service): orchestrate fetch→push.

| Method | Endpoint | Auth | Req/Query | Res | Errors |
|--------|----------|------|-----------|-----|--------|
| POST | `/sync` | protected | `TriggerSync` | `{ jobId, accepted: true }` (202) | `VALIDATION`,`FORBIDDEN`,`RATE_LIMITED`,`SESSION_EXPIRED` |
| GET | `/sync/status` | protected | — | `{ items: SyncStatus[] }` | `UNAUTHENTICATED` |
| GET | `/sync/activity` | protected | `cursor?`,`limit?` | `{ items: ActivityEvent[], nextCursor }` | `UNAUTHENTICATED` |

*authZ:* `connectionId` (if provided) must be owned by caller (verify from JWT, not body). *SESSION_EXPIRED* surfaces "Reconnect". *Rate-limit:* per-user trigger cooldown + queue caps.

### 1.8b Ingest (GIT) — *purpose:* receive captures from the browser extension (Path B v2)
FE: browser-extension background SW. BE(git-service): validate → ownership-check → dedupe → existing GitHub push. See [EXTENSION_PLAN.md](EXTENSION_PLAN.md) §5, [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md).

| Method | Endpoint | Auth | Req | Res | Errors |
|--------|----------|------|-----|-----|--------|
| POST | `/ingest` | protected (same JWT, `client=extension`) | `{ captures: CapturedSubmission[], idempotencyKey? }` | `{ accepted: n, pushed: n, skipped: n }` (202) | `VALIDATION`,`FORBIDDEN`,`RATE_LIMITED` |

*Validation:* Zod-validate each capture; **code size cap**; `platform`/`language` ∈ enum. *authZ:* derive owner from JWT; cross-check against the user's connection — reject foreign data. *Idempotency:* `idempotencyKey` + dedupe vs `problems`/`ingest_log` prevents double-push. *Reuses* the identical GitHub push as `/sync`.

### 1.9 Repositories (GIT) — *purpose:* synced repo view
FE: Repositories. BE(git-service): GitHub metadata + synced problems.

| Method | Endpoint | Auth | Path/Query | Res | Errors |
|--------|----------|------|------------|-----|--------|
| GET | `/repos` | protected | — | `{ items: RepoInfo[] }` | `UNAUTHENTICATED` |
| GET | `/repos/:platform/files` | protected | `cursor?`,`limit?` | `{ items: RepoFile[], nextCursor }` | `NOT_FOUND` |
| GET | `/repos/:platform/commits` | protected | `cursor?`,`limit?` | `{ items: CommitInfo[], nextCursor }` | `NOT_FOUND` |

### 1.10 Problem detail (GIT) — *purpose:* question + solution
FE: Problem detail. BE(git-service): return stored problem + synced code reference.

| Method | Endpoint | Auth | Path | Res | Errors |
|--------|----------|------|------|-----|--------|
| GET | `/problems/:platform/:number` | protected* | `platform`,`number` | `ProblemDetail` | `NOT_FOUND` |

*\*Decide later if public-shareable.* *Validation:* `platform` ∈ enum, `number` slug-safe. Upstream-sourced content sanitized (anti-XSS).

---

# Part 2 — Frontend Responsibilities (per page)

> For each: APIs · when called · loading · empty · success · error · retry · cache · state updates.

| Page | APIs (when) | Loading | Empty | Success | Error | Retry | Cache | State update |
|------|-------------|---------|-------|---------|-------|-------|-------|--------------|
| **Login** | `GET /auth/github/start` (click) | button spinner | — | redirect to `/app` | inline | manual | none | set session on return |
| **Overview** | `GET /users/me` (mount), `GET /stats` (mount), `GET /connections` (mount), `GIT /sync/status` (mount) | skeleton cards/table | "Connect a platform" CTA | render | retry banner | auto (transient) | RQ 10m, refetch on focus | hydrate stats/connections cache |
| **Analytics** | `GET /stats?range&platform` (mount + filter change) | skeleton charts | "No data yet" | render | retry | auto | RQ 10m | refetch on filter change |
| **Repositories** | `GIT /repos` (mount), `/repos/:p/files` & `/commits` (on select) | skeleton list | "Nothing synced yet" | render | retry | auto | RQ; revalidate on focus | paginate via cursor |
| **Problem detail** | `GIT /problems/:p/:n` (mount/SSR) | skeleton panels / SSR | — | render | `notFound`/retry | manual | SSR + RQ | — |
| **Manage profile** | `GET /settings` (mount), `PATCH /settings` (toggle) | skeleton | — | optimistic toggle + toast | revert + toast | manual | RQ; optimistic | optimistic then reconcile |
| **Public profile** | `GET /public/:username` (SSR/ISR) | SSR (none) / skeleton on client nav | "Profile empty/private" | render | `notFound` | — | ISR revalidate | — |
| **Sync status** | `GIT /sync/status` (mount + poll), `/sync/activity` (mount), `POST /sync` (button) | skeleton table | "Nothing synced yet" | render + 202 toast | retry / `SESSION_EXPIRED`→Reconnect | auto | RQ short stale; poll while running | invalidate status after trigger |
| **Settings** | `GET /settings`,`/connections`,`/github/repos` (mount); `PATCH`/`DELETE` (actions) | skeleton sections | — | toast | per-section retry / field errors | manual | RQ | invalidate related queries on mutate |
| **Notifications** | `GET /notifications` (mount), `POST /notifications/read` (action) | skeleton rows | "All caught up" | render | retry | auto | RQ | optimistic mark-read; update bell count |
| **Connect** | `POST /connections` (submit), `POST /connections/:id/authorize` or `GIT /sync` (mode) | button spinner | — | redirect (overview/sync) | inline field error / `CONFLICT` | manual | invalidate connections/stats | add connection to cache |
| **Contact** | submit (form) | button spinner | — | success state | inline | manual | none | — |
| **Landing/Legal** | none | — | — | — | — | — | static | — |

**Global FE rules:** 401 → redirect `/login?next=`; `SESSION_EXPIRED` → show Reconnect affordance; mutations invalidate dependent queries (connect → stats+connections; sync → sync status); all server data via React Query, all forms via RHF+Zod.

---

# Part 3 — Backend Responsibilities (per API)

> For each: business logic · validations · authZ · DB (high-level) · responses · errors · logging · performance.

**`GET /auth/github/callback`** — exchange code→GitHub token; fetch profile; **upsert User**; encrypt+store GitHub token; issue JWT+refresh. *Validations:* state match (CSRF), code present. *AuthZ:* public. *DB:* upsert `users`, insert `auth_sessions`. *Errors:* `UNAUTHENTICATED` on bad state/exchange. *Log:* login event (no token). *Perf:* one upstream call; cache nothing.

**`GET /users/me` / `PATCH /users/me`** — read/update profile. *Validations:* allowlist fields; reject privileged fields. *AuthZ:* self only. *DB:* read/update `users`. *Errors:* `VALIDATION`. *Log:* settings change (audit). *Perf:* indexed by id.

**`POST /connections`** — add platform handle. *Validations:* platform enum; **strict username regex (anti-SSRF)**; uniqueness. *AuthZ:* self. *DB:* insert `connections`. *Errors:* `CONFLICT` on dup. *Log:* connect (audit). *Perf:* cheap.

**`POST /connections/:id/authorize`** — store encrypted sync token. *Validations:* token present; id owned. *AuthZ:* ownership. *DB:* update `connections.sessionToken` (encrypted) + status. *Errors:* `FORBIDDEN`,`NOT_FOUND`. *Log:* authorize (audit; **never log token**). *Perf:* cheap.

**`GET /stats`** — aggregate Path A. *Logic:* for each connection call platform integration, merge totals/difficulty/topics/languages/streaks. *Validations:* query allowlist. *AuthZ:* self. *DB:* read `connections`; cache in Redis. *Errors:* `UPSTREAM_ERROR` (partial → `degraded[]`). *Log:* upstream failures (warn). *Perf:* **cache TTL**, per-platform throttle, parallel fetch with timeouts.

**`GET /public/:username`** — public aggregate. *Logic:* resolve user, public-only fields. *Validations:* username format. *AuthZ:* public; **rate-limited**. *DB:* read; cache. *Errors:* uniform `404`. *Log:* abnormal volume. *Perf:* heavy cache; ISR.

**`PATCH /settings` / `/github/repos/:platform`** — update prefs/mapping. *Validations:* enums + booleans + allowlist. *AuthZ:* self. *DB:* update `users`/`github_repos`. *Log:* audit. *Perf:* cheap.

**`GET /notifications` / `POST /notifications/read`** — list/mark. *AuthZ:* self. *DB:* read/update `notifications`. *Perf:* paginate, index `(userId, createdAt)`.

**`POST /sync` (GIT)** — enqueue sync. *Logic:* validate caller owns connection; **enqueue job** (don't run inline); dedupe via per-connection lock. *Validations:* connectionId owned, token not expired. *AuthZ:* JWT + ownership. *DB:* read `connections`/`github_repos`. *Errors:* `SESSION_EXPIRED`,`RATE_LIMITED`. *Log:* job enqueued (jobId). *Perf:* queue caps, cooldown.

**Sync worker (GIT, background)** — fetch accepted submissions + code + question; diff vs `problems`; push `<num>/question.md`+`solution.<ext>`; regenerate README; write `problems`/`sync_runs`; emit notification; mark expiry. *Security:* decrypt token in-memory only, never log; egress allowlist. *Perf:* backoff, idempotency, concurrency caps.

**`GET /repos`,`/files`,`/commits`,`/problems/...` (GIT)** — read synced data + GitHub metadata. *AuthZ:* self. *DB:* read `problems`/`sync_runs`; cache GitHub metadata. *Errors:* `NOT_FOUND`. *Perf:* paginate; cache GitHub calls.

---

# Part 4 — Shared Data Contracts (models)

> Field tables (not code). **R** = required, **O** = optional.

### User
| Field | Type | R/O | Validation / Notes |
|------|------|-----|--------------------|
| id | string | R | opaque |
| githubLogin | string | R | unique |
| displayName | string | O | 1–80 chars |
| handle | string | R | `^[a-z0-9_-]{3,30}$`, unique (public URL) |
| avatarUrl | string(url) | O | GitHub avatar (no uploads) |
| email | string | O | **never in public responses** |
| role | enum(user,admin) | R | server-set |
| plan | enum(free,pro) | R | server-set; reserved (pricing deferred) |
| createdAt | datetime | R | |
*Relations:* 1→* Connection, GithubRepo, Notification.

### UpdateUser (request)
`displayName?`(string), `handle?`(string, regex). *No other fields accepted.*

### Connection
| Field | Type | R/O | Notes |
|------|------|-----|-------|
| id | string | R | |
| platform | enum | R | leetcode/codeforces/codechef/hackerrank |
| username | string | R | platform handle; strict regex |
| syncEnabled | boolean | R | true if authorized for code sync |
| tokenStatus | enum(none,active,expired) | R | never returns the token itself |
| lastSyncedAt | datetime | O | |
| solvedCount | number | O | cached |
*Relations:* belongs to User; 1→* Problem.

### CreateConnection (request)
`platform`(enum, R), `username`(string, R, regex).

### AuthorizeSync (request)
`sessionToken`(string, R) [+ csrf token if platform needs it]. *Stored encrypted; never echoed.*

### AggregatedStats (response)
| Field | Type | Notes |
|------|------|-------|
| totalSolved | number | sum across platforms |
| byDifficulty | { easy,medium,hard:number } | |
| byPlatform | [{ platform, solved, pct }] | |
| byTopic | [{ name, count }] | top N |
| byLanguage | [{ name, count }] | |
| streak | { current, longest } | |
| ratings | [{ platform, current, peak }] | e.g. Codeforces |
| heatmap | [{ date, count }] | last 365d |
| syncedToGit | { count, pct } | |
| degraded | platform[] | platforms that failed to fetch |

### SubmissionSummary
`title`(string), `platform`(enum), `number`(string|null), `difficulty`(enum|rating), `language`(string), `solvedAt`(datetime), `syncedPath`(string|null).

### PublicProfile (response)
Public-only subset: `displayName`, `handle`, `avatarUrl`, `byPlatform`, `byDifficulty`, `byTopic`, `heatmap`, `totals`, `bestStreak`. **No** email/tokens/private flags.

### Settings
`sync` { autoSync:boolean, frequency:enum(3h,6h,daily), includeQuestion:boolean, maintainReadme:boolean, onlyAccepted:boolean } · `publicProfile` { enabled:boolean, visibleSections:string[] } · `notifications` { syncFailures:boolean, weeklySummary:boolean, productUpdates:boolean } · `appearance` { theme:enum(light,dark,system) }.

### RepoMapping / RepoInfo
`platform`(enum), `repoFullName`(string), `visibility`(enum public,private), `folderConvention`(enum number,difficulty,topic), `defaultBranch`(string), `fileCount`(number), `lastSyncAt`(datetime).

### RepoFile · CommitInfo · ProblemDetail
- **RepoFile:** `number`(string), `title`(string), `language`(string), `path`(string), `updatedAt`(datetime).
- **CommitInfo:** `sha`(string), `message`(string), `committedAt`(datetime).
- **ProblemDetail:** `platform`,`number`,`title`,`difficulty`,`language`,`solvedAt`,`questionMarkdown`(sanitized),`solutionCode`(text),`solutionPath`,`githubUrl`,`platformUrl`,`tags`[].

### SyncStatus · ActivityEvent · TriggerSync · Notification
- **SyncStatus:** `connectionId`,`platform`,`username`,`status`(active,expired),`lastSyncedAt`,`itemsSynced`(number).
- **ActivityEvent:** `id`,`type`(push,fetch,refresh,expire,error),`message`,`createdAt`,`refPath?`.
- **TriggerSync (request):** `connectionId?`(string; omit = all owned).
- **Notification:** `id`,`type`(sync,expiry,badge,repo),`title`,`body`,`read`(boolean),`createdAt`.

### ExtensionSession · CapturedSubmission (Path B v2)
- **ExtensionSession:** `id`,`client`(="extension"),`userAgent`,`ip`,`createdAt`,`lastSeenAt`,`revoked`(boolean).
- **CapturedSubmission (request item):** `platform`(enum),`number`(string),`slug`(string),`title`(string),`difficulty`(enum),`tags`[],`language`(string),`solutionCode`(text; size-capped),`questionMarkdown`(string),`solvedAt`(datetime). Normalized client-side to the same `SolutionToSync` shape git-service already pushes.

---

# Part 5 — Development Dependency Map

```
                 ┌────────── must exist first (BE) ──────────┐
Config/DB ─▶ Auth(JWT) ─▶ Connections ─▶ Stats ─┬─▶ Public profile
                 │                               └─▶ (token) ─▶ GIT Sync ─▶ Repos/Problem/Status
GIT: GitHub publish ─▶ Sync worker ─▶ Scheduler ─▶ Notifications(events)

FE pages → APIs they need:
 Login → /auth/*                  Overview → /users/me,/stats,/connections,GIT /sync/status
 Analytics → /stats               Repositories → GIT /repos,/files,/commits
 Problem → GIT /problems          Manage profile → /settings   Public → /public/:username
 Sync → GIT /sync/*               Settings → /settings,/connections,/github/repos
 Notifications → /notifications   Connect → /connections,GIT /sync
 Landing/Legal/Contact → none
```

**Independent (no cross-dev blocking):** Landing, Legal, Contact, UI kit, layouts (FE); Config, Auth, Connections (BE).
**Require coordination (contract must be frozen):** Stats shape, Sync status/trigger, Repos/Problem, Public profile.
**Critical blockers:** ① **JWT contract** (blocks all protected work, both services) ② **Connection + token model** (blocks GIT sync) ③ **AggregatedStats shape** (blocks Overview/Analytics) ④ **GitHub publish** (blocks worker → Repos/Problem).

---

# Part 6 — Milestone Execution Plan (sequential, assignable tasks)

> Each milestone: Goal · Deliverables · FE tasks · BE tasks · Integration · Testing · Deps · Risks · DoD.

### M0 — Foundations & contract freeze
- **Goal:** tooling + frozen contracts so parallel work can start.
- **FE:** init Next.js+TS+Tailwind tokens; api-client (2 bases) skeleton; React Query + MSW mocks from this contract.
- **BE:** init both services; config/env validation; DB+migrations baseline; health endpoints; error envelope; CI (lint/test/SCA/secret-scan).
- **Integration:** publish `API_CONTRACT` + DTO types both consume.
- **Testing:** CI green; mock server returns contract shapes.
- **Deps:** none. **Risks:** contract churn → freeze JWT + AggregatedStats now.
- **DoD:** both apps boot; mocks live; CI passes.

### M1 — Auth & shell
- **Goal:** sign in + navigable shells.
- **FE:** UI kit (Button…ConfirmDialog,Toast); 3 layouts; route groups + guard; Login page + AuthProvider.
- **BE:** OAuth start/callback; JWT issue/verify (shared by both services); refresh+rotation; `/auth/session`,`/logout`; ownership middleware.
- **Integration:** login→`/app`; 401 redirect; git-service verifies same JWT.
- **Testing:** login flow E2E; protected route rejects no-token; refresh/reuse.
- **Deps:** M0. **Risks:** JWT/cookie/CSRF setup → do CSRF + SameSite now.
- **DoD:** real login works end-to-end; guards enforced.

### M2 — Connections & Path A stats → Overview
- **Goal:** core dashboard from username alone.
- **FE:** Connect flow; Overview page wiring data-viz to `/stats`,`/connections`; loading/empty/error states.
- **BE:** Connections CRUD + encrypted-token authorize; one platform integration at a time (LeetCode→CF→CC→HR); stats aggregation + cache; `/stats`,`/stats/recent`.
- **Integration:** swap MSW→real `/stats`; verify `AggregatedStats` shape.
- **Testing:** numbers correct; partial-failure `degraded`; empty state; cache hit.
- **Deps:** M1. **Risks:** platform API instability → adapters + cache + degrade.
- **DoD:** real dashboard renders from connected handles.

### M3 — Public profile + Analytics + Settings
- **Goal:** shareable profile, deeper stats, account mgmt.
- **FE:** `/u/[username]` (SSR/ISR); Analytics (filters); Settings sections + ConfirmDialog/toasts; Manage profile.
- **BE:** `/public/:username` (cached, hardened); `/settings`,`/github/repos`; detailed `/stats`.
- **Integration:** SSR data; optimistic toggles; mutations invalidate queries.
- **Testing:** enumeration defense; no PII leak; settings persistence.
- **Deps:** M2. **Risks:** scraping → rate-limit+cache.
- **DoD:** public link works; settings save; analytics live.

### M4 — GitHub publish + Path B sync (GIT)
- **Goal:** solutions land in GitHub.
- **FE:** Sync status page; Repositories (skeleton wiring); "Re-sync"/Reconnect.
- **BE(GIT):** verify JWT; GitHub client; folder writer + README generator (test with mock solution); submission/code/question fetch (LeetCode first); sync orchestrator (diff/idempotent); `/sync`,`/sync/status`,`/sync/activity`; write `problems`/`sync_runs`.
- **Integration:** trigger→202→status updates; expiry→Reconnect.
- **Testing:** idempotent re-run; expiry handling; egress allowlist; no token in logs.
- **Deps:** M2 (connections+tokens). **Risks:** non-idempotent push → diff+lock.
- **DoD:** new accepted problem appears in repo; status accurate.

### M5 — Repositories, Problem detail, Notifications, Automation
- **Goal:** complete the surface + hands-off sync.
- **FE:** Repositories (files/commits), Problem detail, Notifications.
- **BE:** `/repos`,`/files`,`/commits`,`/problems/...`; scheduler+queue+workers+locks; notifications emit + `/notifications`,`/read`.
- **Integration:** repo browse → problem detail; bell count; scheduled syncs.
- **Testing:** pagination; sanitized content; cron once-only; mark-read.
- **Deps:** M4. **Risks:** queue duplicates → lock+idempotency.
- **DoD:** all 15 pages live on real data.

### M6 — Hardening & deploy
- **Goal:** production-ready.
- **FE:** skeletons everywhere, error boundaries, a11y/responsive QA, OG images, perf budgets.
- **BE:** SECURITY_PLAN critical items, rate limits, audit logs, alerts, backups+restore test.
- **Integration:** staging E2E; load + sync-batch test.
- **Testing:** pentest plan (SECURITY_PLAN §18); deployment checklist.
- **Deps:** M0–M5. **DoD:** all checklists pass; deployed to prod.

---

# Part 7 — Parallel Development Strategy (2 devs)

- **FE can start immediately (no BE):** UI kit, layouts, routing, **Landing/Legal/Contact**, and **every app page against MSW mocks** built from Part 4 shapes.
- **BE priority order:** Config/DB → **Auth/JWT (freeze contract)** → Connections + token model → Stats → GIT publish → Sync.
- **Finalize early (freeze first):** **JWT claims**, **AggregatedStats**, **Connection**, **SyncStatus**, error envelope. These unblock everyone.
- **Mock data:** FE uses MSW returning Part-4 shapes until each real endpoint lands, then flips a flag per resource.
- **Integration checkpoints:** end of each milestone = "swap mocks→real" for that module + contract-conformance test.
- **Daily coordination:** 10-min sync — what endpoints landed, any contract change (PR-gated), blockers.
- **Merge strategy:** trunk-based, small PRs, rebase before merge, squash; feature-flag incomplete work.
- **Conflict avoidance:** **folder ownership** (FE: `web-frontend/`,`frontendHtml/`; BE: `web-backend/`,`git-service/`) + shared types in one place + contract changes only via PR to `API_CONTRACT.md` + DTOs.

```
Day 0:  freeze contract ──┬─▶ FE: UI kit + layouts + marketing + mocked app pages
                          └─▶ BE: config → auth → connections → stats → sync
Checkpoints: M1 auth · M2 stats · M3 public/settings · M4 sync · M5 full · M6 deploy
```

---

# Part 8 — Testing & Integration Checklist (per feature)

> Template applied to every feature.

**Auth**
- FE: redirect on 401; cookie set; logout clears; guard works · BE: state/PKCE, JWT verify both services, refresh rotation/reuse · API: 401 shape, CSRF on mutations · Edge: expired/forged token · Errors: bad state · Perf: callback latency · Security: no token in logs, redirect allowlist.

**Connections / Connect**
- FE: form validation; CONFLICT message; success redirect · BE: username regex (SSRF), uniqueness, ownership · API: 409/403/404 shapes · Edge: duplicate, invalid platform · Security: token encrypted, never echoed.

**Stats / Overview / Analytics**
- FE: skeleton/empty/error; filter refetch; cache · BE: aggregation correctness, partial-failure `degraded`, cache TTL · API: query allowlist · Edge: zero connections, all-fail · Perf: parallel fetch + timeouts.

**Public profile**
- FE: SSR render, notFound, no PII · BE: uniform 404, public-only fields, rate-limit · Security: enumeration + scraping defense.

**Sync (GIT)**
- FE: trigger→toast; status poll; Reconnect on SESSION_EXPIRED · BE: ownership from JWT, idempotent diff, queue caps, expiry · API: 202/409/429 · Edge: expired token, duplicate trigger, GitHub outage · Security: egress allowlist, no token logs · Perf: backoff, concurrency caps.

**Repositories / Problem**
- FE: pagination, empty, row→detail · BE: ownership, sanitized content · Security: stored-XSS from platform titles · Perf: cache GitHub metadata.

**Settings / Notifications**
- FE: optimistic toggle revert; per-section retry; confirm on destructive · BE: field allowlist (mass-assignment), audit log · API: validation details · Edge: concurrent edits.

---

# Part 9 — Final Project Execution Roadmap

### 9.1 Development order
`M0 Foundations+contract → M1 Auth+shell → M2 Connections+Stats+Overview → M3 Public+Analytics+Settings → M4 GitHub publish+Sync → M5 Repos+Problem+Notifications+Automation → M6 Hardening+Deploy`

### 9.2 Feature dependency timeline
```
M0 ─▶ M1 ─▶ M2 ─┬─▶ M3 ──────────────┐
                └─▶ M4 ─▶ M5 ─────────┴─▶ M6
FE marketing/UI-kit run alongside M0–M1 (no BE dep).
```

### 9.3 Team responsibilities
| Area | FE dev | BE dev |
|------|--------|--------|
| Owns | web-frontend/, frontendHtml/, UI/UX, states | web-backend/, git-service/, DB, security |
| Shared | API_CONTRACT.md, DTO types, integration tests, milestone checkpoints | same |

### 9.4 Integration timeline
- After **each** milestone: swap that module's mocks → real, run contract-conformance + E2E, sign off before next.

### 9.5 Final deployment readiness checklist
*(Whole-product gate — includes frontend + deploy items still pending. Ticked = done.)*
- [ ] All endpoints conform to this contract (conformance tests pass) *(endpoints built; automated conformance tests pending)*
- [ ] AuthN/Z: JWT verified both services; ownership/BOLA; CSRF; refresh rotation *(JWT+ownership+refresh done; anti-CSRF token middleware pending)*
- [x] Tokens envelope-encrypted; no secrets in logs/bundle; git-service not browser-keyed
- [x] Rate limits + queue caps + SSRF egress allowlist
- [ ] Every page: loading + empty + error + success verified *(frontend not built yet)*
- [ ] Public profile: no PII, enumeration-hardened, SSR/ISR + OG *(API: no-PII + uniform 404 done; SSR/ISR+OG = frontend)*
- [ ] TLS + security headers + strict CORS *(headers + CORS done; TLS deploy-time)*
- [ ] Migrations reproducible; backups encrypted + restore-tested *(migrations done; backups deploy-time)*
- [ ] Observability: redacted logs, audit trail, alerts *(redacted logs done; alerts/audit-shipping pending)*
- [ ] Responsive (mobile→ultra-wide) + a11y *(frontend)*
- [ ] CI: lint/typecheck/tests/SCA/secret-scan green; branch protection on *(CI not set up)*
- [ ] Staging E2E + load + sync-batch passed; runbooks + on-call ready *(deploy-time)*
- [ ] UAT: every page matches approved `frontendHtml/` prototype *(frontend)*

---

> This contract is the interface. **Any change to an endpoint, model, or error shape must be a PR to this file + the shared DTO types**, announced at the daily sync. When you're ready, I can expand any milestone into a per-task ticket list, or generate the typed DTO reference — still no code.
