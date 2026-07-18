# 🏛️ CodeVault — Shared Architecture Deep-Dive

> System architecture reference. The single place that explains **how the three services fit together**, data flow, topology decisions, and cross-cutting design choices. All other docs (`BACKEND_PLAN`, `FRONTEND_PLAN`, `API_CONTRACT`, etc.) reference this as the structural foundation.

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. System Overview

CodeVault is a **3-service monorepo** (web-frontend, web-backend, git-service) plus a **cross-browser extension** that aggregates competitive programming stats and auto-syncs accepted solutions to GitHub. The extension is an additional client of the same two backends (Path B v2 — see §3).

```
                     ┌──────────────────────────────────────────────┐
                     │              web-frontend (Next.js)           │
                     │  SSG/SSR/ISR + client islands (React Query)   │
                     │  User's browser + Vercel edge                 │
                     └─────────────┬───────────────┬────────────────┘
                     user JWT      │               │ user JWT
                     (cookie)      ▼               ▼
              ┌─────────────────────┐   ┌────────────────────────┐
              │    web-backend      │   │     git-service         │
              │ auth · stats · user │   │ sync engine · GitHub   │
              │ connections · prefs │   │ scheduler + workers    │
              │ public profiles     │   │ problem store          │
              └─────────┬───────────┘   └──────────┬─────────────┘
                        │                           │
                        ▼                           ▼
                   ┌──────────────────────────────────┐
                   │         PostgreSQL (managed)      │
                   │  one DB, per-service DB roles     │
                   │  per-table write ownership        │
                   └──────────────┬───────────────────┘
                                  │
                   ┌──────────────┴───────────────────┐
                   │              Redis                │
                   │  stats cache · rate-limit         │
                   │  BullMQ job queue                 │
                   └──────────────────────────────────┘

Clients (present the same user JWT):
  web-frontend (above) · browser-extension → web-backend (auth) + git-service (POST /api/ingest)

External integrations (git-service workers, no public ingress):
  LeetCode GraphQL · Codeforces API · CodeChef · HackerRank · GitHub REST API
```

---

## 2. Topology Decision — Why the Frontend Calls Both Backends

Three options were evaluated:

| Option | Description | Verdict |
|--------|-------------|---------|
| **FE → web-backend → git-service (BFF)** | web-backend proxies all git-service calls | Rejected: extra hop; sync scales independently; web-backend becomes bottleneck |
| **FE → git-service only** | single service | Rejected: conflates identity/stats with sync concerns |
| ✅ **FE → both directly** | two API bases (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GIT_SERVICE_URL`) | **Chosen**: independent scaling, clear ownership, sync failures isolated from dashboard |

**Security constraint:** git-service validates the **same user JWT** issued by web-backend (shared signing key). The browser presents a cookie — never a static internal key (SECURITY_PLAN S1).

---

## 3. Two Integration Paths

| Path | What it does | Who serves it | Auth needed |
|------|-------------|---------------|------------|
| **A — Public stats** | Fetch solved counts, difficulty, topics, streak, ratings by username from each platform's public API | web-backend (stats module) | Username only — no platform session token |
| **B — Code sync (server-side)** | Fetch accepted submissions + source code + question; push `<number>/question.md` + `solution.<ext>` to GitHub | git-service (sync workers) | Platform session token (encrypted in DB, one-time connect) |
| **B v2 — Code sync (extension)** | Capture the user's *own* accepted code in-browser at solve-time; `POST /api/ingest` → same GitHub push | browser-extension → git-service | The **same CodeVault user JWT** (no platform session stored server-side) |

Path A and Path B are **independent failure domains**: if a session expires, the stats dashboard keeps working. **Path B v2 (extension)** is the preferred ingestion source for code — it removes the fragile server-side session replay by capturing in the user's own authenticated browser. The git-service GitHub push pipeline is **identical** for B and B v2; only the ingestion source differs. See [EXTENSION_PLAN.md](EXTENSION_PLAN.md).

---

## 4. Layered Architecture (both backend services)

```
Route       ← URL wiring only; no logic
Controller  ← HTTP I/O: validate input (Zod), call service, shape response; never touches DB
Service     ← business logic + orchestration; the only layer that crosses concerns
Integration ← external systems (platform APIs, GitHub); one file per system
Repository  ← DB access (Prisma); the only layer touching the database
Cross-cutting ← config, logger, errors, validators, middlewares, types, utils
```

Dependency direction: **Route → Controller → Service → Repository / Integration**. No upward imports. Controllers never import repositories directly.

---

## 5. Database Ownership Model (single DB, two services)

```
Table               web-backend writes?    git-service writes?
────────────────────────────────────────────────────────────────
users               ✅ owns                reads only
oauth_identities    ✅ owns                reads only
connections         ✅ owns                reads only
connection_secrets  ✅ owns                reads only (decrypt in-memory)
github_repos        ✅ owns                reads only
stats_snapshots     ✅ owns                ❌
problems            reads only             ✅ owns
sync_runs           reads only             ✅ owns
notifications       ✅ append              ✅ append
audit_logs          ✅ append              ✅ append
auth_sessions       ✅ owns                ❌
```

Enforced via **separate PostgreSQL roles** per service — not just application convention (see DATABASE_PLAN §10).

---

## 6. Security Architecture (three defence layers)

```
Layer 1 — Edge:    WAF (Cloudflare) → DDoS / bot detection / IP rate-limit
Layer 2 — Service: JWT verify on every request; ownership check on every object; field allowlist (mass-assignment prevention)
Layer 3 — Data:    Envelope-encrypted tokens (KMS); separate DB roles; append-only audit trail; optional RLS
```

The browser **never sees** platform session tokens. git-service workers decrypt tokens in-memory only, never log them, and only communicate with allowlisted external hosts (PLATFORM_INTEGRATION §7, SECURITY_PLAN §8).

---

## 7. Request Lifecycle (web-backend — protected request)

```
HTTP request
  → TLS termination (platform / CDN)
  → CORS check (origin allowlist)
  → body-size limit
  → request-id injection
  → structured access log (pino)
  → rate-limit check (Redis)
  → auth middleware: verify JWT → attach req.user (401 if missing/invalid)
  → route match
  → controller: Zod schema validate input (400 if invalid)
  → service: business logic
      → repository: Prisma query (user_id ownership filter always applied)
      → integration: platform API call (if needed)
      → Redis cache read/write (if applicable)
  → response shaped (consistent envelope)
  → error middleware (last): map typed error → status + safe JSON
  → access log line emitted with status + duration
```

---

## 8. Sync Worker Lifecycle (git-service — background job)

```
Cron tick / manual trigger
  → BullMQ enqueue SyncJob(userId, connectionId)
  → Worker picks up job
  → Acquire per-connection Redis lock (skip if already running — idempotency)
  → Read Connection + github_repos from DB
  → Read ConnectionSecret → decrypt token via KMS (in-memory only; never logged)
  → Call platform adapter.fetchAcceptedSubmissions(token, handle)
  → Diff against problems table (find new slugs via unique constraint)
  → For each new problem:
      → adapter.fetchSubmissionCode(token, submissionId)
      → adapter.fetchProblemStatement(handle, slug)
  → GitHub: batch push all new problems in one commit
  → Upsert problems rows (idempotent on slug)
  → Update SyncRun status + connections.last_synced_at + solved_count
  → Emit notification (success / partial / SESSION_EXPIRED)
  → Release lock; zeroize decrypted token from memory
```

---

## 9. Frontend Architecture

**Rendering strategy per surface:**

| Surface | Strategy | Why |
|--------|----------|-----|
| Landing, Legal, Contact | **SSG** | Pure content; fastest; CDN-cached |
| `/u/[username]` (public profile) | **SSR + ISR** | SEO + shareable; data changes slowly |
| App pages (dashboard, settings…) | **Client islands + React Query** | Personal data; no SEO value; rich interactivity |
| Login | **Static shell + client form** | No server data needed |

**Three layout shells** (route groups in App Router):
- `(marketing)` → `PublicLayout` (Navbar + Footer)
- `(auth)` → `AuthLayout` (split brand panel + form slot)
- `(app)` → `AppLayout` (Sidebar + Topbar + MobileDrawer, auth-guarded by middleware)

**State tiers:** server data → React Query; forms → React Hook Form + Zod; auth/session → Context + httpOnly cookie; UI (drawer, toasts, dialogs) → lightweight Context.

---

## 10. Deployment Topology

```
Cloudflare (DNS + WAF + DDoS)
  ──▶ Vercel (web-frontend: edge / SSG / SSR / ISR)
  ──▶ PaaS LB ──▶ web-backend (N stateless replicas)
  ──▶ PaaS LB ──▶ git-service API (N stateless replicas)
                  git-service workers (M queue consumers — NO public ingress)
                        │
              Postgres (managed, HA, PITR, encrypted backups)
              Redis (managed, HA — cache + queue)
              KMS (key management — crown-jewel secrets)
```

All services are **stateless** (JWT auth + Redis for shared state) → scale horizontally without coordination. Workers scale on **queue depth** independently of the API tier.

---

## 11. Cross-Cutting Concerns

| Concern | Design |
|---------|--------|
| **Correlation** | `requestId` (HTTP) + `jobId` (workers) in every log line + error response |
| **Error handling** | Typed hierarchy → single error middleware → `{ error: { code, message, requestId, details? } }` |
| **Secrets** | Secret manager + KMS in prod; never in env files; never in logs; never in client bundle |
| **API versioning** | All routes under `/api/v1`; breaking changes → `/v2`, never silent |
| **Idempotency** | Problems upserted on `(userId, platform, slug)` unique key; per-connection sync lock |
| **Soft delete** | `users.deleted_at` for GDPR soft-delete; `connection_secrets` hard-purged on delete |
| **Timezone** | All timestamps UTC in DB + API; convert at display layer only |
| **Platform extensibility** | One adapter file per platform; no other files change to add a new platform (PLATFORM_INTEGRATION §10) |
| **Content safety** | All upstream platform content (titles, question HTML) sanitized before rendering or storage |


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [x] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))

---

## 📱 Mobile client (`mobile/`)

A React Native (Expo SDK 54 / expo-router) app that is a **fourth client** alongside the web
frontend, admin console, and browser extension. It consumes the exact same APIs — `web-backend`
(`/api/*`) for auth/stats/settings/social and `git-service` (`/api/*`) for sync/repos/problems — so
there is no mobile-specific backend. Auth uses email magic-link → a Bearer JWT stored in secure
storage (native cookie jar handles refresh). It runs on a device via Expo Go over the LAN. Details:
[MOBILE_APP.md](MOBILE_APP.md).
