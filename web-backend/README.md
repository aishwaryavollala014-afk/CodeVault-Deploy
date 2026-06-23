<div align="center">

# 🌐 CodeVault — Web Backend

### The API behind the analytics website.

A layered **Node.js + Express + TypeScript** service that powers the user website: authentication, platform connections, multi‑platform stats aggregation, and public shareable profiles. The [web‑frontend](../web-frontend) talks to this service for everything except GitHub sync (which is the [git‑service](../git-service)).

</div>

---

## 📑 Table of Contents

1. [Responsibility](#-responsibility)
2. [Where it sits](#-where-it-sits)
3. [Request lifecycle](#-request-lifecycle)
4. [Tech stack & versions](#-tech-stack--versions)
5. [Folder structure](#-folder-structure)
6. [Layer‑by‑layer guide](#-layer-by-layer-guide)
7. [File‑by‑file guide](#-file-by-file-guide)
8. [API endpoints](#-api-endpoints)
9. [Rules & conventions](#-rules--conventions)
10. [Getting started](#-getting-started)

---

## 🎯 Responsibility

The web‑backend owns the **website** side:

- **Auth** — GitHub sign‑in / sessions.
- **Connections** — manage which platform usernames a user has added.
- **Stats** — aggregate public stats across platforms (**Path A**, username only) for the dashboard.
- **Public profiles** — serve a user's total analysis by username (no auth) for the shareable profile page.

It does **not** push code to GitHub — that's the [git‑service](../git-service).

---

## 🧭 Where it sits

```
web-frontend ──REST──▶ web-backend   (this service: auth, stats, public profiles)
             └─REST──▶ git-service   (sync code to GitHub)
```

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
[ service ]      → business logic; calls platform integrations + DB
      │
      ▼
[ integration ]  → LeetCode GraphQL / Codeforces API / Prisma
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
| Framework | **Express** | `4.19.x` |
| ORM | **Prisma** | `5.18.x` |
| Database | **SQLite** (dev) → **PostgreSQL** (prod) | — |
| Validation | **Zod** | `3.x` |
| HTTP client | **axios** | `1.x` |
| Logging | **pino** | `9.x` |

---

## 📁 Folder structure

```
web-backend/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── nodemon.json
│
├── prisma/
│   └── schema.prisma            # User, Connection, Problem
│
├── tests/
│   └── .gitkeep
│
└── src/
    ├── index.ts                 # entry
    ├── app.ts                   # Express app (middlewares + routes)
    ├── server.ts                # HTTP server + graceful shutdown
    │
    ├── config/                  # env & database config
    │   ├── index.ts
    │   ├── env.ts
    │   └── database.ts
    │
    ├── routes/                  # URL → controller
    │   ├── index.ts
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── platform.routes.ts
    │   ├── stats.routes.ts
    │   └── public.routes.ts     # no-auth analysis by username
    │
    ├── controllers/             # HTTP I/O
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   ├── platform.controller.ts
    │   ├── stats.controller.ts
    │   └── public.controller.ts
    │
    ├── services/                # business logic
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   ├── stats.service.ts     # aggregate multi-platform stats
    │   └── platforms/           # public stats fetchers
    │       ├── index.ts
    │       ├── leetcode.service.ts
    │       ├── codeforces.service.ts
    │       ├── codechef.service.ts
    │       └── hackerrank.service.ts
    │
    ├── middlewares/             # auth, errors, rate limit, validation
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   ├── rateLimit.middleware.ts
    │   └── validate.middleware.ts
    │
    ├── lib/                     # shared low-level helpers
    │   ├── prisma.ts
    │   ├── logger.ts
    │   └── httpClient.ts
    │
    ├── types/
    │   ├── index.ts
    │   └── platform.types.ts
    │
    ├── utils/
    │   ├── errors.ts
    │   └── helpers.ts
    │
    └── validators/
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
| **Controllers** | `controllers/` | Parse request, call service, respond | Never touch the DB directly |
| **Services** | `services/` | All business logic | Only layer that orchestrates integrations |
| **Integrations** | `services/platforms/` | Public stats fetch | One file per platform |
| **Middlewares** | `middlewares/` | Auth, validation, errors, rate limit | Reusable across routes |
| **Lib / Utils / Types / Validators** | respective | Shared building blocks | Pure & dependency‑light |

---

## 📄 File‑by‑file guide

### Routes → Controllers
| Route file | Controller | Handles |
|------------|-----------|---------|
| `auth.routes.ts` | `auth.controller.ts` | GitHub OAuth login / callback / logout. |
| `user.routes.ts` | `user.controller.ts` | User profile & settings. |
| `platform.routes.ts` | `platform.controller.ts` | Add/list/remove platform usernames. |
| `stats.routes.ts` | `stats.controller.ts` | Aggregated dashboard stats (auth). |
| `public.routes.ts` | `public.controller.ts` | Public total analysis by username (no auth). |

### Services
| File | Purpose |
|------|---------|
| `auth.service.ts` | GitHub OAuth exchange, user upsert, session/JWT. |
| `user.service.ts` | User CRUD and connections via Prisma. |
| `stats.service.ts` | Aggregate stats across all connected platforms. |
| `platforms/index.ts` | Registry returning a platform service by name. |
| `platforms/leetcode.service.ts` | LeetCode public stats (GraphQL). |
| `platforms/codeforces.service.ts` | Codeforces stats (official API). |
| `platforms/codechef.service.ts` | CodeChef stats (public profile). |
| `platforms/hackerrank.service.ts` | HackerRank stats (public profile). |

### Middlewares / Lib / Utils / Types / Validators
| File | Purpose |
|------|---------|
| `middlewares/auth.middleware.ts` | Reject unauthenticated requests. |
| `middlewares/error.middleware.ts` | Consistent JSON error shape. |
| `middlewares/rateLimit.middleware.ts` | Throttle per client. |
| `middlewares/validate.middleware.ts` | Run Zod validators on input. |
| `lib/prisma.ts` | Single shared Prisma client. |
| `lib/logger.ts` | Configured logger. |
| `lib/httpClient.ts` | Pre-configured axios instance. |
| `types/platform.types.ts` | `PlatformStats`, `PlatformName` types. |
| `utils/errors.ts` | Typed error classes. |
| `utils/helpers.ts` | Small reusable helpers. |
| `validators/auth.validator.ts` | Auth request schemas. |
| `validators/platform.validator.ts` | Connect-platform schemas. |

---

## 🌐 API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/github` | Start GitHub OAuth. |
| `GET`  | `/api/auth/github/callback` | OAuth callback. |
| `GET`  | `/api/users/me` | Current user profile. |
| `POST` | `/api/platforms/connect` | Add a platform username. |
| `GET`  | `/api/platforms` | List the user's connections. |
| `GET`  | `/api/stats` | Aggregated dashboard stats (auth). |
| `GET`  | `/api/public/:username` | Public total analysis (no auth). |

> GitHub sync endpoints live in the [git‑service](../git-service), which the frontend calls directly.

---

## 📐 Rules & conventions

1. **Strict layering** — Routes have no logic; Controllers never touch the DB; only Services orchestrate.
2. **One integration per file** under `services/platforms/`.
3. **Validate at the edge** with Zod via `validate.middleware`.
4. **Central error handling** — throw typed errors; `error.middleware` formats them.
5. **Config is validated** — refuse to start with missing env.
6. **Secrets only in `.env`** — documented in `.env.example`.
7. **Single Prisma client** — import from `lib/prisma.ts`.
8. **Own‑data‑only** with consent.
9. **Commits:** small, prefixed; authored solely by the project owner — no co‑authors.

---

## 🚀 Getting started

```bash
cd web-backend
npm install
cp .env.example .env       # DATABASE_URL, GitHub OAuth, PORT
npx prisma db push
npm run dev                # API on http://localhost:4000
```
