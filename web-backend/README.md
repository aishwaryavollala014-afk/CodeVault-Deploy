<div align="center">

# ⚙️ CodeVault — Backend

### The API & automation engine behind CodeVault.

A layered **Node.js + Express + TypeScript** service that fetches stats and solutions from coding platforms, runs scheduled syncs, and pushes organized solutions to GitHub.

</div>

---

## 📑 Table of Contents

1. [Architecture overview](#-architecture-overview)
2. [Request lifecycle](#-request-lifecycle)
3. [Tech stack & versions](#-tech-stack--versions)
4. [Folder structure](#-folder-structure)
5. [Layer‑by‑layer guide](#-layer-by-layer-guide)
6. [File‑by‑file guide](#-file-by-file-guide)
7. [API endpoints](#-api-endpoints)
8. [Background jobs](#-background-jobs)
9. [Backend rules & conventions](#-backend-rules--conventions)
10. [Getting started](#-getting-started)

---

## 🏗 Architecture overview

The backend follows a clean **layered architecture**. Each request flows through clearly separated responsibilities, so logic is testable, reusable, and easy to reason about:

```
Route  ──▶  Controller  ──▶  Service  ──▶  Integration / Database
 (URL)      (HTTP I/O)      (business      (LeetCode, GitHub,
                             logic)         Prisma, …)
```

- **Routes** map a URL to a controller.
- **Controllers** handle the HTTP request/response only — no business logic.
- **Services** hold all business logic and call integrations.
- **Integrations** (platforms / github) talk to the outside world.
- **Middlewares, jobs, lib, utils, validators, types** support every layer.

---

## 🔄 Request lifecycle

```
Incoming HTTP request
      │
      ▼
[ middlewares ]  → auth check, rate limit, body validation
      │
      ▼
[ route ]        → matches the URL to a controller method
      │
      ▼
[ controller ]   → reads input, calls a service, shapes the response
      │
      ▼
[ service ]      → business logic; calls platform/github integrations + DB
      │
      ▼
[ integration ]  → LeetCode GraphQL / Codeforces API / GitHub REST / Prisma
      │
      ▼
   Response  ◀── (errors flow to error.middleware for consistent formatting)
```

---

## 🛠 Tech stack & versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | **Node.js** | `≥ 18.18` |
| Language | **TypeScript** | `5.5.x` |
| HTTP framework | **Express** | `4.19.x` |
| ORM | **Prisma** | `5.18.x` |
| Database | **SQLite** (dev) → **PostgreSQL** (prod) | — |
| Scheduling | **node-cron** | `3.x` |
| Validation | **Zod** | `3.x` |
| HTTP client | **axios** | `1.x` |
| Logging | **pino** | `9.x` |
| Dev reload | **nodemon** + **ts-node** | latest |

---

## 📁 Folder structure

```
backend/
├── package.json                # dependencies, scripts, metadata
├── tsconfig.json               # TypeScript compiler config
├── .env.example                # required environment variables (template)
├── .gitignore                  # backend-specific ignores
├── nodemon.json                # dev auto-reload config
│
├── prisma/
│   └── schema.prisma           # database models (shared with the app)
│
├── tests/                      # unit & integration tests
│   └── .gitkeep
│
└── src/
    ├── index.ts                # entry point (loads env, starts server)
    ├── app.ts                  # builds the Express app (middlewares + routes)
    ├── server.ts               # creates the HTTP server & graceful shutdown
    │
    ├── config/                 # configuration & environment
    │   ├── index.ts            # re-exports all config
    │   ├── env.ts              # loads & validates environment variables
    │   └── database.ts         # database connection settings
    │
    ├── routes/                 # URL → controller mapping
    │   ├── index.ts            # mounts all route modules under /api
    │   ├── auth.routes.ts      # /api/auth
    │   ├── user.routes.ts      # /api/users
    │   ├── platform.routes.ts  # /api/platforms (connect / list)
    │   ├── sync.routes.ts      # /api/sync (trigger a sync run)
    │   └── stats.routes.ts     # /api/stats (dashboard data)
    │
    ├── controllers/            # HTTP request/response handling
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── platform.controller.ts
    │   ├── sync.controller.ts
    │   └── stats.controller.ts
    │
    ├── services/               # business logic
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── sync.service.ts     # orchestrates fetch → diff → push
    │   ├── stats.service.ts    # aggregates multi-platform stats
    │   ├── platforms/          # one integration per coding platform
    │   │   ├── index.ts        # registry that resolves a platform by name
    │   │   ├── leetcode.service.ts
    │   │   ├── codeforces.service.ts
    │   │   ├── codechef.service.ts
    │   │   └── hackerrank.service.ts
    │   └── github/             # GitHub publishing
    │       ├── github.service.ts     # push files via the REST API
    │       └── readme.generator.ts   # build the repo index README
    │
    ├── middlewares/            # cross-cutting request logic
    │   ├── auth.middleware.ts        # verify the user is authenticated
    │   ├── error.middleware.ts       # central error formatter
    │   ├── rateLimit.middleware.ts   # protect against abuse
    │   └── validate.middleware.ts    # run Zod validators on input
    │
    ├── jobs/                   # scheduled background work
    │   ├── scheduler.ts        # registers cron jobs on boot
    │   └── sync.job.ts         # periodic auto-sync for all connections
    │
    ├── lib/                    # shared low-level helpers
    │   ├── prisma.ts           # single Prisma client instance
    │   ├── logger.ts           # configured logger
    │   └── httpClient.ts       # pre-configured axios instance
    │
    ├── types/                  # shared TypeScript types
    │   ├── index.ts
    │   └── platform.types.ts   # Stats, Submission, Solution shapes
    │
    ├── utils/                  # pure helper functions
    │   ├── errors.ts           # typed error classes (AppError, NotFound…)
    │   └── helpers.ts          # small reusable utilities
    │
    └── validators/             # request input schemas (Zod)
        ├── auth.validator.ts
        └── platform.validator.ts
```

---

## 🧱 Layer‑by‑layer guide

| Layer | Folder | Responsibility | Rule |
|-------|--------|----------------|------|
| **Entry** | `index.ts`, `app.ts`, `server.ts` | Boot the app | Keep thin — wiring only |
| **Config** | `config/` | Load & validate env | Fail fast if env is invalid |
| **Routes** | `routes/` | Map URLs to controllers | No logic, just wiring |
| **Controllers** | `controllers/` | Parse request, call service, send response | Never touch the DB directly |
| **Services** | `services/` | All business logic | The only layer that orchestrates integrations |
| **Integrations** | `services/platforms/`, `services/github/` | Talk to external APIs | One file per external system |
| **Middlewares** | `middlewares/` | Auth, validation, errors, rate limit | Reusable across routes |
| **Jobs** | `jobs/` | Scheduled syncs | Call services, never duplicate logic |
| **Lib / Utils / Types / Validators** | respective | Shared building blocks | Pure & dependency‑light |

---

## 📄 File‑by‑file guide

### Root
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`, `prisma`), metadata. |
| `tsconfig.json` | TypeScript compiler options + path aliases. |
| `.env.example` | Template of all required env vars (DB, GitHub token, platform sessions, port). |
| `.gitignore` | Backend ignores (`node_modules`, `dist`, `.env`, local DB). |
| `nodemon.json` | Watches `src/` and restarts on change in development. |
| `prisma/schema.prisma` | Database models: User, Connection, Problem. |

### Entry
| File | Purpose |
|------|---------|
| `src/index.ts` | The process entry — loads config and starts the server. |
| `src/app.ts` | Creates the Express app, registers middlewares and routes. |
| `src/server.ts` | Starts the HTTP listener and handles graceful shutdown. |

### Config
| File | Purpose |
|------|---------|
| `config/env.ts` | Reads `process.env`, validates with Zod, exports a typed config. |
| `config/database.ts` | Database connection configuration. |
| `config/index.ts` | Barrel file re-exporting config. |

### Routes → Controllers
| Route file | Controller | Handles |
|------------|-----------|---------|
| `auth.routes.ts` | `auth.controller.ts` | Login / GitHub OAuth callback / logout. |
| `user.routes.ts` | `user.controller.ts` | User profile & settings. |
| `platform.routes.ts` | `platform.controller.ts` | Connect a platform, list connections. |
| `sync.routes.ts` | `sync.controller.ts` | Trigger a manual sync run. |
| `public.routes.ts` | `public.controller.ts` | Public, no‑auth analysis by username (powers the shareable profile website). |
| `stats.routes.ts` | `stats.controller.ts` | Return aggregated dashboard stats. |

### Services
| File | Purpose |
|------|---------|
| `auth.service.ts` | Authentication & token handling logic. |
| `user.service.ts` | User CRUD and settings logic. |
| `sync.service.ts` | Orchestrates: fetch new submissions → fetch the question statement → diff against DB → push the `<number>/question.md` + `<number>/solution.<ext>` folder via GitHub → regenerate the index README. |
| `stats.service.ts` | Aggregates stats across all connected platforms for the dashboard. |
| `platforms/index.ts` | Registry that returns the right platform service by name. |
| `platforms/leetcode.service.ts` | LeetCode public stats + authorized submission/code fetch + public question‑statement fetch. |
| `platforms/codeforces.service.ts` | Codeforces stats via official API. |
| `platforms/codechef.service.ts` | CodeChef stats (public profile). |
| `platforms/hackerrank.service.ts` | HackerRank stats (public profile). |
| `github/github.service.ts` | Creates the per‑problem folder (named by problem number) and commits `question.md` + `solution.<ext>` via the GitHub REST API. |
| `github/readme.generator.ts` | Builds the synced‑repo README index table (number, title, type, difficulty, language, date, link). |

### Middlewares / Jobs / Lib / Utils / Types / Validators
| File | Purpose |
|------|---------|
| `middlewares/auth.middleware.ts` | Rejects unauthenticated requests. |
| `middlewares/error.middleware.ts` | Catches errors and returns a consistent JSON shape. |
| `middlewares/rateLimit.middleware.ts` | Throttles requests per client. |
| `middlewares/validate.middleware.ts` | Runs a Zod schema against the request. |
| `jobs/scheduler.ts` | Registers all cron jobs at startup. |
| `jobs/sync.job.ts` | Periodically syncs every active connection. |
| `lib/prisma.ts` | Single shared Prisma client. |
| `lib/logger.ts` | Configured application logger. |
| `lib/httpClient.ts` | Pre‑configured axios instance (timeouts, retries). |
| `types/index.ts` | Shared type barrel. |
| `types/platform.types.ts` | `Stats`, `Submission`, `Solution` interfaces. |
| `utils/errors.ts` | Typed error classes (`AppError`, `NotFoundError`, …). |
| `utils/helpers.ts` | Small reusable pure helpers. |
| `validators/auth.validator.ts` | Zod schemas for auth requests. |
| `validators/platform.validator.ts` | Zod schemas for connecting a platform. |

---

## 🌐 API endpoints

> Planned surface (implemented incrementally).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/github` | Start GitHub OAuth. |
| `GET`  | `/api/auth/github/callback` | OAuth callback. |
| `GET`  | `/api/users/me` | Current user profile. |
| `POST` | `/api/platforms/connect` | Connect a platform (username + optional session). |
| `GET`  | `/api/platforms` | List the user's connections. |
| `POST` | `/api/sync` | Trigger a sync run now. |
| `GET`  | `/api/stats` | Aggregated multi‑platform dashboard stats (auth). |
| `GET`  | `/api/public/:username` | Public total analysis for the shareable profile (no auth). |

---

## 📂 Synced repo layout (output)

The backend writes solutions into the user's linked GitHub repo with **one folder per problem, named by its problem number**:

```
<problem-number>/
├── question.md          # statement: title, difficulty, tags, link, description
└── solution.<ext>       # the user's accepted code (ext from the language)
```

- `sync.service.ts` builds this for each new accepted submission.
- `github.service.ts` creates/updates the two files and commits them.
- `readme.generator.ts` regenerates the top‑level index README after each run.

---

## ⏰ Background jobs

- **`sync.job.ts`** runs on a schedule (default every few hours). For each active connection it fetches new accepted submissions, diffs against already‑synced problems, and pushes the new ones to GitHub.
- **`scheduler.ts`** registers all cron jobs when the server boots.

---

## 📐 Backend rules & conventions

1. **Strict layering** — Routes never contain logic; Controllers never touch the DB; only Services orchestrate integrations.
2. **One integration per file** — each external system (a platform, GitHub) gets its own service file.
3. **Validate at the edge** — every request body is validated with a Zod schema via `validate.middleware`.
4. **Central error handling** — throw typed errors from `utils/errors.ts`; `error.middleware` formats them.
5. **Config is validated** — the app refuses to start with missing/invalid env vars.
6. **Secrets only in `.env`** — never commit real tokens; `.env.example` documents the keys.
7. **Single Prisma client** — import from `lib/prisma.ts`, never instantiate elsewhere.
8. **Consent‑first & own‑data‑only** — the backend accesses only the user's own data, with authorization.
9. **Commits:** small and prefixed (`feat:`, `fix:`, `chore:`, `docs:`); authored solely by the project owner — no co‑authors.

---

## 🚀 Getting started

> The backend is currently a skeleton (empty files showing the structure). Once implemented:

```bash
cd backend

# 1. Install
npm install

# 2. Configure
cp .env.example .env      # fill in DATABASE_URL, GITHUB_TOKEN, PORT, etc.

# 3. Database
npx prisma db push

# 4. Run (dev, auto-reload)
npm run dev               # API on http://localhost:4000
```
