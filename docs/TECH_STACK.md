# 🛠️ CodeVault — Tech Stack

> Canonical reference for every technology used in CodeVault and the version to install.
> Changes from the original plan are marked 🔄.

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## Languages & Runtime

| Technology | Version | Role |
|-----------|---------|------|
| **Node.js** | `≥ 20.x` LTS 🔄 | JavaScript runtime for both backends |
| **TypeScript** | `5.5.x` | Typed JavaScript — catches bugs before runtime |
| **tsx** | latest | Runs `.ts` files directly in dev (no separate compile step) |
| **nodemon** | latest | Watches files, auto-restarts on save (hot reload) |

> 🔄 Node.js bumped from `≥ 18.18` → `≥ 20.x`. Node 18 reaches end-of-life April 2025; Node 20 is the current Active LTS.

---

## Web Framework & HTTP

| Technology | Version | Role |
|-----------|---------|------|
| **Express** | `5.x` 🔄 | Web framework handling HTTP requests/routes for both backends |
| REST API | — | Style of HTTP endpoints (GET/POST to URLs returning JSON) |
| Route | — | Maps a URL (e.g. `/api/stats`) to the code that handles it |
| Controller | — | Reads the request, calls a service, shapes the JSON response |
| Service | — | Business logic layer (the "brain") — the only layer that orchestrates |
| Repository | — | The layer that talks to the database (keeps DB code in one place) |
| Middleware | — | Code that runs between request and handler (auth, logging, errors) |

> 🔄 Express bumped from `4.19.x` → `5.x`. Express 5 catches `async/await` errors in route handlers automatically — no manual `try/catch + next(err)` needed on every route. With 15+ routes across two backends, this removes significant boilerplate.

```typescript
// Express 4 (old) — manual error catching required
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await statsService.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err); // must be called manually
  }
});

// Express 5 (new) — async errors caught automatically
router.get('/stats', async (req, res) => {
  const stats = await statsService.getStats(req.user.id);
  res.json(stats); // if this throws, Express 5 routes it to error middleware
});
```

---

## Database

| Technology | Version | Role |
|-----------|---------|------|
| **PostgreSQL** | `16.x` | Relational SQL database — users, connections, problems, sync records |
| **Prisma ORM** | `5.18.x` | Define tables in `schema.prisma`, query in TypeScript |
| **SQLite** | — | Dev-only swap via `DATABASE_URL`; production always uses Postgres |
| **cuid2** | latest | Short, random, non-guessable IDs used as each row's primary key |
| **Redis** | `7.x` | In-memory store — caching platform stats, rate-limiting, job queue |
| **ioredis** | `5.x` | Node.js library that connects to Redis |

---

## Background Jobs & Scheduling

| Technology | Version | Role |
|-----------|---------|------|
| **BullMQ** | `5.x` | Job queue on Redis — runs sync work in the background with retries and DLQ |
| **node-cron** | `3.x` | Schedules the auto-sync trigger to run every few hours |

> **Critical pattern:** `node-cron` only **enqueues** a BullMQ job. It never performs sync logic inline. This ensures a server crash mid-sync = the job is retried automatically from Redis.

```
node-cron (trigger) → enqueues job → BullMQ (executes) → sync logic runs
```

---

## HTTP Client & Platform APIs

| Technology | Version | Role |
|-----------|---------|------|
| **axios** | `1.x` | HTTP client used to call platform APIs (LeetCode, Codeforces) + GitHub API |
| **GraphQL** | — | Query style LeetCode's internal API uses (vs REST) |
| **Codeforces REST API** | — | Official `user.info` + `user.status` endpoints |
| **Idempotent syncs** | — | Running sync twice produces no duplicates (safe to retry) |

---

## Auth & Security

| Technology | Role |
|-----------|------|
| **GitHub OAuth + PKCE** | Sign in via GitHub — no passwords handled |
| **JWT — Access Token** | Short-lived (`≈ 30 min`) token sent on every request |
| **JWT — Refresh Token** | Longer-lived token used to get a new access token without re-login |
| **Token rotation + reuse detection** | Each refresh issues a new token; a reused old one revokes all (theft defense) |
| **httpOnly cookie** | Stores the refresh token so JavaScript can't read it (XSS protection) |
| **Envelope encryption (AES-256-GCM)** | Encrypts stored platform OAuth tokens and GitHub tokens at rest |
| **KMS** | Key Management Service — securely stores the master encryption key in production |
| **Zod** | Validates all incoming request shapes — rejects bad/malicious input at the edge |
| **CSRF tokens** | Blocks attacks tricking the browser into sending forged requests |
| **CORS** | Rules for which origins may call the API |
| **helmet** | Sets secure HTTP response headers automatically |
| **SSRF protection** | Strict username validation + allowlists block server-side request forgery |
| **BOLA / IDOR protection** | Ownership checks on every resource access |
| **Rate limiting** | Caps requests per user/IP to stop abuse and DoS |

---

## Logging & Observability

| Technology | Role |
|-----------|------|
| **pino** | Fast structured JSON logger — secrets are redacted from all log output |
| **requestId** | A unique ID on every request to trace it across logs |
| **Graceful shutdown** | On stop: finish in-flight requests, then close DB/Redis connections cleanly |
| `/health` endpoint | "Process is alive" |
| `/ready` endpoint | "DB + Redis are reachable" |

---

## Frontend

| Technology | Version | Role |
|-----------|---------|------|
| **Next.js** (App Router) | `15.x` | React framework — pages, routing, SSR/ISR/SSG |
| **React** | `18.3.x` | UI component library |
| **Tailwind CSS** | `4.x` 🔄 | Utility CSS classes for styling |
| **TanStack Query** | `5.x` 🆕 | Manages fetching, caching, and syncing server data in the UI |
| **TypeScript** | `5.5.x` | Typed frontend code |

> 🔄 Tailwind bumped from `3.4.x` → `4.x`. Now stable (2025). 5–10× faster builds, no `tailwind.config.ts` file, uses native CSS `@theme` variables. Since the frontend hasn't been written yet, now is the correct time to adopt v4.

> 🆕 TanStack Query (React Query v5) added. It was listed in the original tech spec but missing from the implementation plan. It replaces manual `useEffect + useState` fetch patterns with `useQuery` / `useMutation` — built-in caching, loading states, error handling, and deduplication.

---

## Rendering Strategy (Next.js)

| Page | Strategy | Reason |
|------|----------|--------|
| `/` (Landing) | **SSG** — Static | Public, never changes per-user — fastest possible |
| `/login` | **SSG** | Static page |
| `/dashboard` | **CSR** — Client-side | Private, user-specific — no public SEO needed |
| `/connect` | **CSR** — Client-side | Interactive, authenticated |
| `/u/[username]` | **ISR** — Incremental Static | Public profile — pre-built, auto-refreshes on a schedule |

---

## Containers & Infrastructure

| Technology | Role |
|-----------|------|
| **Docker** | Packages each service + its environment into a reproducible container |
| **docker-compose** | Defines and runs all containers together (Postgres, Redis, web-backend, git-service) |
| **Dockerfile** | Per-service recipe for building a container image |
| **Volume** | Docker disk storage so the database persists across restarts |
| **Healthcheck** | Docker probe to know a container is actually ready before routing traffic |

---

## Service Ports (Dev)

| Service | Port |
|---------|------|
| `web-frontend` (Next.js UI) | `3000` |
| `web-backend` (Stats & Auth API) | `4000` |
| `git-service` (GitHub Sync Engine) | `5000` |
| PostgreSQL | `5432` |
| Redis | `6379` |

---

## Summary of Changes vs. Original Plan

| Original | Updated | Why |
|----------|---------|-----|
| `Node.js ≥ 18.18` | **Node.js ≥ 20.x LTS** | Node 18 EOL April 2025 |
| `Express 4.19.x` | **Express 5.x** | Auto async error handling, less boilerplate |
| `Tailwind CSS 3.4.x` | **Tailwind CSS 4.x** | Faster, native CSS variables, no JS config file |
| React Query *(missing)* | **TanStack Query 5.x** | Was in original spec, missing from plan — now added |
