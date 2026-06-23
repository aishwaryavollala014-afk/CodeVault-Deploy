# 🧭 CodeVault — Build Plan

This document is the **implementation spec** for CodeVault. For every file in the skeleton it explains, in plain English, what code should be written there. No code is included here — this is the blueprint to build from, in order.

> Read this together with [README.md](README.md), [backend/README.md](backend/README.md), and [frontend/README.md](frontend/README.md).

---

## 📋 Build order (recommended)

Build bottom‑up so each layer can rely on the one below it.

| Phase | Goal | Files involved |
|-------|------|----------------|
| 1 | Backend foundation | config, lib, types, utils, prisma |
| 2 | Platform integrations | `services/platforms/*` |
| 3 | GitHub publishing | `services/github/*` |
| 4 | Core services | `services/*.service.ts` |
| 5 | API layer | routes + controllers + middlewares + validators |
| 6 | Automation | jobs (scheduler + sync job) |
| 7 | Frontend foundation | lib, types, constants, styles, features |
| 8 | Frontend UI | components + pages + hooks |

---

# ⚙️ BACKEND

## Root config

| File | What to write |
|------|---------------|
| `backend/package.json` | Declare dependencies (express, prisma, @prisma/client, zod, axios, node-cron, pino, dotenv) and dev deps (typescript, ts-node, nodemon, @types/*). Add scripts: `dev`, `build`, `start`, `prisma:push`, `prisma:studio`, `lint`. |
| `backend/tsconfig.json` | Strict TypeScript config targeting Node, `outDir: dist`, `rootDir: src`, module resolution for Node, and a `@/*` path alias to `src/`. |
| `backend/.env.example` | List every env var with placeholder values: `PORT`, `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_SYNC_REPO`, `JWT_SECRET`, per‑platform session keys, `SYNC_INTERVAL_MINUTES`, `LOG_LEVEL`. |
| `backend/.gitignore` | Ignore `node_modules`, `dist`, `.env`, local DB files, logs. |
| `backend/nodemon.json` | Watch `src/`, run `ts-node src/index.ts`, watch `.ts` extensions, ignore `tests`. |

## Database

| File | What to write |
|------|---------------|
| `backend/prisma/schema.prisma` | Datasource + generator. Models: **User** (id, githubLogin, email, createdAt, relations). **Connection** (id, userId, platform, username, sessionToken?, isActive, lastSyncedAt, unique on userId+platform). **Problem** (id, userId, platform, number, title, slug, difficulty?, topics?, language?, solvedAt?, syncedToGit, unique on userId+platform+slug). |

## Entry

| File | What to write |
|------|---------------|
| `backend/src/index.ts` | Load env via config, create the app, start the server, register the cron scheduler. Catch and log fatal startup errors. |
| `backend/src/app.ts` | Build and return the Express app: apply global middlewares (json parser, CORS, rate limit, request logging), mount the API router under `/api`, then mount the error middleware last. |
| `backend/src/server.ts` | Create the HTTP server from the app, listen on the configured port, log the URL, and handle graceful shutdown on SIGINT/SIGTERM (close server + DB). |

## Config

| File | What to write |
|------|---------------|
| `backend/src/config/env.ts` | Read `process.env`, validate it with a Zod schema, throw if anything required is missing, and export a typed, frozen `env` object. |
| `backend/src/config/database.ts` | Database connection settings derived from `env` (URL, pool options if Postgres). |
| `backend/src/config/index.ts` | Barrel file re‑exporting `env` and database config. |

## Routes (URL → controller)

| File | What to write |
|------|---------------|
| `backend/src/routes/index.ts` | Create the main router, mount each feature router (`/auth`, `/users`, `/platforms`, `/sync`, `/stats`), export it. |
| `backend/src/routes/auth.routes.ts` | `POST /github`, `GET /github/callback`, `POST /logout` → auth controller methods. |
| `backend/src/routes/user.routes.ts` | `GET /me` (auth‑protected) → user controller. |
| `backend/src/routes/platform.routes.ts` | `POST /connect` (with validator), `GET /` (list), `DELETE /:id` → platform controller. |
| `backend/src/routes/sync.routes.ts` | `POST /` to trigger a sync run (auth‑protected) → sync controller. |
| `backend/src/routes/stats.routes.ts` | `GET /` returns aggregated dashboard stats → stats controller. |

## Controllers (HTTP only)

| File | What to write |
|------|---------------|
| `backend/src/controllers/auth.controller.ts` | Handle GitHub OAuth start/callback, issue a session/JWT, and logout. Read input, call `auth.service`, send JSON; no logic here. |
| `backend/src/controllers/user.controller.ts` | Return the authenticated user's profile via `user.service`. |
| `backend/src/controllers/platform.controller.ts` | Connect a platform, list connections, remove one — delegating to `platform`/`user` services. |
| `backend/src/controllers/sync.controller.ts` | Call `sync.service.runSync` for the current user, return a summary (counts of synced problems). |
| `backend/src/controllers/stats.controller.ts` | Call `stats.service.getAggregatedStats` and return it. |

## Services (business logic)

| File | What to write |
|------|---------------|
| `backend/src/services/auth.service.ts` | Exchange the GitHub OAuth code for a token, fetch the GitHub profile, upsert the User, create a session/JWT. |
| `backend/src/services/user.service.ts` | Fetch/update a user and their connections from the DB via Prisma. |
| `backend/src/services/sync.service.ts` | The orchestrator: for a user's active connections, fetch recent accepted submissions (platform service), fetch each problem's statement, diff against already‑synced `Problem` rows, and for each new one push a folder named by the **problem number** containing `question.md` + `solution.<ext>` via `github.service`, regenerate the index README, and update `lastSyncedAt`. |
| `backend/src/services/stats.service.ts` | For each connection, call the platform service's stats function, then merge into a unified totals object (by difficulty, by topic, per platform, streaks). |
| `backend/src/services/platforms/index.ts` | A registry/factory that maps a platform name string to its service, plus a shared `PlatformService` interface (`getStats`, `getRecentSubmissions`). |
| `backend/src/services/platforms/leetcode.service.ts` | `getStats(username)` via public GraphQL. `getRecentSubmissions(session)` via authorized GraphQL, then fetch each submission's source code. `getQuestion(slug)` via public GraphQL to fetch the problem statement (title, difficulty, tags, content) for `question.md`. Handle expired sessions explicitly. |
| `backend/src/services/platforms/codeforces.service.ts` | `getStats(handle)` via official `user.info` + `user.status` API; count distinct solved problems. (No source code available.) |
| `backend/src/services/platforms/codechef.service.ts` | `getStats(username)` by parsing the public profile page; return solved count, rating. |
| `backend/src/services/platforms/hackerrank.service.ts` | `getStats(username)` from the public profile/badges; return solved/badge counts. |
| `backend/src/services/github/github.service.ts` | Using the GitHub REST API + token: ensure the target repo exists, then for a problem create/update the folder named by its **problem number** with `question.md` (statement) and `solution.<ext>` (the user's code), and commit them. |
| `backend/src/services/github/readme.generator.ts` | Take all synced problems and render a sorted Markdown index table (number → folder link, title, type, difficulty, language, date, problem link); return the README string to commit at the repo root. |

## Middlewares

| File | What to write |
|------|---------------|
| `backend/src/middlewares/auth.middleware.ts` | Verify the session/JWT, attach `req.user`, reject with 401 if missing/invalid. |
| `backend/src/middlewares/error.middleware.ts` | Central error handler: map known `AppError` types to status codes, log unexpected errors, return a consistent JSON error shape. |
| `backend/src/middlewares/rateLimit.middleware.ts` | Limit requests per IP/user over a time window to prevent abuse. |
| `backend/src/middlewares/validate.middleware.ts` | Accept a Zod schema, validate `req.body`/`params`/`query`, return 400 with details on failure. |

## Jobs

| File | What to write |
|------|---------------|
| `backend/src/jobs/scheduler.ts` | On boot, register cron jobs using the configured interval; start them; export a function to register all jobs. |
| `backend/src/jobs/sync.job.ts` | The scheduled task: load all active connections and run `sync.service` for each; log results; skip/flag connections with expired sessions. |

## Lib / Utils / Types / Validators

| File | What to write |
|------|---------------|
| `backend/src/lib/prisma.ts` | Instantiate and export a single shared `PrismaClient` (reused across reloads). |
| `backend/src/lib/logger.ts` | Configure and export a pino logger using `env.LOG_LEVEL`. |
| `backend/src/lib/httpClient.ts` | Export a pre‑configured axios instance (base timeouts, retry, default headers) used by platform/github services. |
| `backend/src/types/index.ts` | Shared backend types barrel (e.g. `AuthedRequest`, common response shapes). |
| `backend/src/types/platform.types.ts` | Interfaces: `PlatformStats`, `Submission`, `Question` (statement for `question.md`), `SolutionToSync` (number, slug, language, code, question), `PlatformName` union. |
| `backend/src/utils/errors.ts` | Typed error classes: `AppError` (base, with statusCode), `NotFoundError`, `UnauthorizedError`, `ValidationError`, `ExpiredSessionError`. |
| `backend/src/utils/helpers.ts` | Small pure helpers: pad problem numbers, slugify titles, map language → file extension, date formatting. |
| `backend/src/validators/auth.validator.ts` | Zod schemas for auth request bodies (OAuth callback params). |
| `backend/src/validators/platform.validator.ts` | Zod schema for connecting a platform (platform name enum, username, optional session). |

---

# 🎨 FRONTEND

## Root config

| File | What to write |
|------|---------------|
| `frontend/package.json` | Dependencies (next, react, react-dom) and dev deps (typescript, tailwindcss, postcss, autoprefixer, @types/*). Scripts: `dev`, `build`, `start`, `lint`. |
| `frontend/tsconfig.json` | Next.js TypeScript config with the `@/*` alias to `src/`. |
| `frontend/next.config.mjs` | Next config; enable strict mode; set any allowed image domains. |
| `frontend/tailwind.config.ts` | Theme tokens (brand colors), `content` globs for `src/`, any plugin registration. |
| `frontend/postcss.config.mjs` | Register Tailwind + autoprefixer. |
| `frontend/.env.example` | Public env vars only: `NEXT_PUBLIC_API_URL`. |
| `frontend/.gitignore` | Ignore `node_modules`, `.next`, `.env*.local`, build output. |

## Routes (`src/app`)

| File | What to write |
|------|---------------|
| `frontend/src/app/layout.tsx` | Root layout: html/body shell, metadata, import global CSS, render `Navbar` + children + `Footer`. |
| `frontend/src/app/page.tsx` | Landing page: hero, short pitch, CTA buttons to login/connect. |
| `frontend/src/app/globals.css` | Tailwind directives + base global styles (dark theme background/text). |
| `frontend/src/app/(auth)/login/page.tsx` | Login screen with a "Sign in with GitHub" button that hits the backend auth route. |
| `frontend/src/app/connect/page.tsx` | Form to add a platform username and (optionally) authorize a session; submits via `usePlatforms`. |
| `frontend/src/app/dashboard/page.tsx` | Dashboard: use `useStats` + `usePlatforms`, render the full analytics — `StatsGrid` (totals, difficulty, language), topic strengths, `PlatformList` (rankings + reconnect), `ActivityHeatmap`, and GitHub sync status. |

## Components

| File | What to write |
|------|---------------|
| `frontend/src/components/ui/Button.tsx` | Reusable button with variants (primary/secondary) and sizes; purely presentational. |
| `frontend/src/components/ui/Card.tsx` | Generic card container with padding/border. |
| `frontend/src/components/ui/Badge.tsx` | Small pill for difficulty/status with color by type. |
| `frontend/src/components/dashboard/StatCard.tsx` | Show one metric: label + value (+ optional icon/trend). |
| `frontend/src/components/dashboard/StatsGrid.tsx` | Lay out multiple `StatCard`s from a stats object. |
| `frontend/src/components/dashboard/PlatformList.tsx` | List connected platforms with status and a reconnect button if a session expired. |
| `frontend/src/components/dashboard/ActivityHeatmap.tsx` | Render a calendar heatmap of solve activity. |
| `frontend/src/components/layout/Navbar.tsx` | Top nav: logo, links, auth state. |
| `frontend/src/components/layout/Footer.tsx` | Footer with author/links. |

## Features / Hooks / Lib / Types / Constants / Styles

| File | What to write |
|------|---------------|
| `frontend/src/features/stats/api.ts` | Function calling backend `GET /api/stats` via `api-client`; returns typed stats. |
| `frontend/src/features/stats/types.ts` | DTOs for stats (totals, by‑difficulty, by‑topic, per‑platform). |
| `frontend/src/features/platforms/api.ts` | Functions: connect platform, list connections, remove — via `api-client`. |
| `frontend/src/features/platforms/types.ts` | DTOs for platform/connection objects. |
| `frontend/src/hooks/useStats.ts` | Hook that loads stats (loading/error/data state) from `features/stats/api`. |
| `frontend/src/hooks/usePlatforms.ts` | Hook to list/connect/remove platforms with state. |
| `frontend/src/lib/api-client.ts` | Single fetch/axios wrapper: base URL from env, attach auth header, parse JSON, throw typed errors. |
| `frontend/src/lib/utils.ts` | Small helpers: classnames merge, number/date formatting. |
| `frontend/src/types/index.ts` | Shared frontend types barrel. |
| `frontend/src/constants/platforms.ts` | Static metadata for each platform: display name, icon, brand color, profile URL pattern. |
| `frontend/src/styles/theme.ts` | Design tokens (colors/spacing) usable from TypeScript components. |

---

## ✅ Definition of done (per file)

A file is "done" when it: implements the responsibility above, exports a clean typed interface, contains no logic that belongs in another layer, has secrets read only from env, and is covered by at least a basic test where it holds logic (services, utils, generators).
