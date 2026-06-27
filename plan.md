# 🧭 CodeVault — Build Plan

This document is the **implementation spec** for CodeVault. For every file in the skeleton it explains, in plain English, what code should be written there. No code is included here — this is the blueprint to build from, in order.

> CodeVault is a **3‑service monorepo**: `web-frontend/` (UI), `web-backend/` (website API), `git-service/` (GitHub sync). The frontend calls **both** backends over REST.
> Read this together with [README.md](README.md), [web-frontend/README.md](web-frontend/README.md), [web-backend/README.md](web-backend/README.md), and [git-service/README.md](git-service/README.md).

---

## 📋 Build order (recommended)

| Phase | Service | Goal |
|-------|---------|------|
| 1 | web-backend | Foundation: config, lib, types, utils, prisma |
| 2 | web-backend | Platform **stats** integrations + stats service |
| 3 | web-backend | Auth + API layer (routes, controllers, middlewares, validators) + public profile |
| 4 | git-service | Foundation: config, lib, types, utils, prisma |
| 5 | git-service | Submission/code + question fetchers, GitHub publishing, sync service |
| 6 | git-service | Automation (scheduler + sync job) + sync API |
| 7 | web-frontend | Foundation: lib (2 API bases), types, constants, styles, features |
| 8 | web-frontend | UI: components + pages (dashboard, connect, public profile) + hooks |
| 9 | web-backend + git-service | Extension support: `client=extension` auth endpoints + `POST /api/ingest` |
| 10 | browser-extension | Capture-at-source (Path B v2): auth, content scripts, background, popup/options |

> Phases 9–10 add the **cross-browser extension** (Path B v2). See [docs/EXTENSION_PLAN.md](docs/EXTENSION_PLAN.md). They reverse the original "no extension" stance and **replace** the fragile server-side session replay as the preferred Path B.

---

# 🌐 WEB BACKEND  (`web-backend/`)

Owns the website: auth, connections, multi‑platform **stats** (Path A), and public profiles. Does **not** push code to GitHub.

## Root config
| File | What to write |
|------|---------------|
| `web-backend/package.json` | Deps (express, prisma, @prisma/client, zod, axios, pino, dotenv) + dev deps. Scripts: `dev`, `build`, `start`, `prisma:push`, `lint`. |
| `web-backend/tsconfig.json` | Strict TS for Node, `outDir: dist`, `@/*` alias to `src/`. |
| `web-backend/.env.example` | `PORT`, `DATABASE_URL`, GitHub OAuth client id/secret, `JWT_SECRET`, `LOG_LEVEL`. |
| `web-backend/.gitignore` | Ignore `node_modules`, `dist`, `.env`, local DB, logs. |
| `web-backend/nodemon.json` | Watch `src/`, run via ts-node. |

## Database
| File | What to write |
|------|---------------|
| `web-backend/prisma/schema.prisma` | Models: **User**, **Connection** (platform + username), **Problem** (mirror of synced status for dashboards). |

## Entry / Config
| File | What to write |
|------|---------------|
| `web-backend/src/index.ts` | Load env, create app, start server. |
| `web-backend/src/app.ts` | Build Express app: json, CORS, rate limit, logging; mount `/api` router; error middleware last. |
| `web-backend/src/server.ts` | Listen on port; graceful shutdown. |
| `web-backend/src/config/env.ts` | Read & validate env with Zod; export typed `env`. |
| `web-backend/src/config/database.ts` | DB connection settings from `env`. |
| `web-backend/src/config/index.ts` | Barrel re‑exporting config. |

## Routes → Controllers
| Route | Controller | What to write |
|-------|-----------|---------------|
| `routes/auth.routes.ts` | `auth.controller.ts` | GitHub OAuth start/callback, logout. |
| `routes/user.routes.ts` | `user.controller.ts` | `GET /me`. |
| `routes/platform.routes.ts` | `platform.controller.ts` | Add/list/remove platform usernames. |
| `routes/stats.routes.ts` | `stats.controller.ts` | `GET /` aggregated dashboard stats (auth). |
| `routes/public.routes.ts` | `public.controller.ts` | `GET /:username` public total analysis (no auth, cached). |
| `routes/index.ts` | — | Mount all routers under `/api`. |

## Services
| File | What to write |
|------|---------------|
| `services/auth.service.ts` | OAuth exchange, fetch GitHub profile, upsert User, issue session/JWT. |
| `services/user.service.ts` | User + connection CRUD via Prisma. |
| `services/stats.service.ts` | For each connection call its platform stats fn; merge into unified totals (difficulty, topic, language, per‑platform, streaks). |
| `services/platforms/index.ts` | Registry + `PlatformStatsService` interface (`getStats`). |
| `services/platforms/leetcode.service.ts` | `getStats(username)` via public GraphQL. |
| `services/platforms/codeforces.service.ts` | `getStats(handle)` via official `user.info` + `user.status`. |
| `services/platforms/codechef.service.ts` | `getStats(username)` from public profile. |
| `services/platforms/hackerrank.service.ts` | `getStats(username)` from public profile/badges. |

## Middlewares / Lib / Utils / Types / Validators
| File | What to write |
|------|---------------|
| `middlewares/auth.middleware.ts` | Verify session/JWT; attach `req.user`; 401 otherwise. |
| `middlewares/error.middleware.ts` | Map `AppError` types to status codes; consistent JSON. |
| `middlewares/rateLimit.middleware.ts` | Throttle per IP/user. |
| `middlewares/validate.middleware.ts` | Validate request with a Zod schema. |
| `lib/prisma.ts` | Single shared Prisma client. |
| `lib/logger.ts` | Configured pino logger. |
| `lib/httpClient.ts` | Pre‑configured axios instance. |
| `types/index.ts` | Shared types (`AuthedRequest`, response shapes). |
| `types/platform.types.ts` | `PlatformStats`, `PlatformName` union. |
| `utils/errors.ts` | `AppError`, `NotFoundError`, `UnauthorizedError`, `ValidationError`. |
| `utils/helpers.ts` | Small pure helpers (formatting). |
| `validators/auth.validator.ts` | Zod schemas for auth bodies. |
| `validators/platform.validator.ts` | Zod schema for connecting a platform. |

---

# 📦 GIT SERVICE  (`git-service/`)

Owns Path B: fetch the authorized user's **code + question**, push the per‑problem folder to GitHub, regenerate the index, and run scheduled syncs. The frontend calls it directly; protected by an internal API key.

## Root config
| File | What to write |
|------|---------------|
| `git-service/package.json` | Deps (express, prisma, @prisma/client, axios, node-cron, pino, dotenv) + dev deps. Scripts: `dev`, `build`, `start`, `prisma:push`. |
| `git-service/tsconfig.json` | Strict TS for Node, `@/*` alias. |
| `git-service/.env.example` | `PORT`, `DATABASE_URL`, `GITHUB_TOKEN`, `GITHUB_SYNC_REPO`, platform session keys, `INTERNAL_API_KEY`, `SYNC_INTERVAL_MINUTES`, `LOG_LEVEL`. |
| `git-service/.gitignore` | Ignore `node_modules`, `dist`, `.env`, local DB, logs. |
| `git-service/nodemon.json` | Watch `src/`, run via ts-node. |

## Database / Entry / Config
| File | What to write |
|------|---------------|
| `git-service/prisma/schema.prisma` | Track synced problems (connection ref, platform, number, slug, language, syncedToGit, syncedAt). |
| `git-service/src/index.ts` | Load env, start server, register the cron scheduler. |
| `git-service/src/app.ts` | Build Express app; internal‑key auth, rate limit, logging; mount `/api`; error middleware last. |
| `git-service/src/server.ts` | Listen on port; graceful shutdown. |
| `git-service/src/config/env.ts` | Read & validate env (token, sessions, internal key). |
| `git-service/src/config/index.ts` | Barrel re‑exporting config. |

## Routes / Controller
| File | What to write |
|------|---------------|
| `git-service/src/routes/sync.routes.ts` | `POST /sync` (run), `GET /sync/status`. |
| `git-service/src/routes/index.ts` | Mount sync routes under `/api`. |
| `git-service/src/controllers/sync.controller.ts` | Parse request, call `sync.service`, return a summary. |

## Services
| File | What to write |
|------|---------------|
| `services/sync.service.ts` | Orchestrate: fetch recent accepted submissions + each question, diff against DB, push `<number>/question.md` + `<number>/solution.<ext>` via `github.service`, regenerate index README, update DB. Handle expired sessions. |
| `services/submissions/index.ts` | Registry + `SubmissionService` interface (`getRecentSubmissions`, `getQuestion`). |
| `services/submissions/leetcode.service.ts` | Authorized fetch of accepted submissions + source code; `getQuestion(slug)` for statement. |
| `services/submissions/codeforces.service.ts` | Fetch accepted submissions/code where available. |
| `services/github/github.service.ts` | Ensure repo exists; create/update the per‑number folder with `question.md` + `solution.<ext>`; commit. |
| `services/github/readme.generator.ts` | Render the repo index README table (number → folder link, title, type, difficulty, language, date, link). |

## Middlewares / Jobs / Lib / Utils / Types
| File | What to write |
|------|---------------|
| `middlewares/auth.middleware.ts` | Verify the `INTERNAL_API_KEY` header; reject otherwise. |
| `middlewares/error.middleware.ts` | Consistent JSON error formatting. |
| `middlewares/rateLimit.middleware.ts` | Throttle requests. |
| `jobs/scheduler.ts` | Register cron jobs at boot using the configured interval. |
| `jobs/sync.job.ts` | Periodically run `sync.service` for every active connection; flag expired sessions. |
| `lib/prisma.ts` | Single shared Prisma client. |
| `lib/logger.ts` | Configured pino logger. |
| `lib/httpClient.ts` | Pre‑configured axios instance. |
| `types/index.ts` | Shared types barrel. |
| `types/sync.types.ts` | `Submission`, `Question`, `SolutionToSync` interfaces. |
| `utils/errors.ts` | Typed errors incl. `ExpiredSessionError`. |
| `utils/helpers.ts` | Pad problem numbers, slugify titles, language → file extension. |

---

# 🎨 WEB FRONTEND  (`web-frontend/`)

The website UI. Calls **two** backends: `NEXT_PUBLIC_API_URL` (web-backend) and `NEXT_PUBLIC_GIT_SERVICE_URL` (git-service).

## Root config
| File | What to write |
|------|---------------|
| `web-frontend/package.json` | Deps (next, react, react-dom) + dev (typescript, tailwindcss, postcss, autoprefixer). Scripts: `dev`, `build`, `start`, `lint`. |
| `web-frontend/tsconfig.json` | Next TS config + `@/*` alias. |
| `web-frontend/next.config.mjs` | Strict mode; allowed image domains. |
| `web-frontend/tailwind.config.ts` | Theme tokens + content globs. |
| `web-frontend/postcss.config.mjs` | Tailwind + autoprefixer. |
| `web-frontend/.env.example` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GIT_SERVICE_URL`. |
| `web-frontend/.gitignore` | Ignore `node_modules`, `.next`, `.env*.local`. |

## Routes (`src/app`)
| File | Route | What to write |
|------|-------|---------------|
| `app/layout.tsx` | — | Root shell, metadata, global CSS, `Navbar` + `Footer`. |
| `app/page.tsx` | `/` | Landing: hero + CTAs. |
| `app/globals.css` | — | Tailwind directives + base styles. |
| `app/(auth)/login/page.tsx` | `/login` | "Sign in with GitHub" → web-backend auth. |
| `app/connect/page.tsx` | `/connect` | Add platform username (web-backend) and authorize sync (git-service). |
| `app/dashboard/page.tsx` | `/dashboard` | Private analytics via `useStats`/`usePlatforms`: StatsGrid, topics, PlatformList, ActivityHeatmap, sync status. |
| `app/u/[username]/page.tsx` | `/u/:username` | Public profile via `features/profile/api` (web-backend, no auth); server‑render; renders `ProfileHeader` + `AnalysisSection`. |

## Components
| File | What to write |
|------|---------------|
| `components/ui/Button.tsx` | Button primitive (variants/sizes). |
| `components/ui/Card.tsx` | Card container. |
| `components/ui/Badge.tsx` | Difficulty/status pill. |
| `components/dashboard/StatCard.tsx` | One metric tile. |
| `components/dashboard/StatsGrid.tsx` | Grid of stat cards. |
| `components/dashboard/PlatformList.tsx` | Connections list + reconnect on expiry. |
| `components/dashboard/ActivityHeatmap.tsx` | Solve‑activity heatmap. |
| `components/layout/Navbar.tsx` | Top nav + auth state. |
| `components/layout/Footer.tsx` | Footer. |
| `components/profile/ProfileHeader.tsx` | Public profile header: avatar, name, handles, headline totals. |
| `components/profile/AnalysisSection.tsx` | Public profile body: full analysis. |

## Features / Hooks / Lib / Types / Constants / Styles
| File | What to write |
|------|---------------|
| `features/stats/api.ts` | `GET /api/stats` on **web-backend** via `api-client`. |
| `features/stats/types.ts` | Stats DTOs. |
| `features/platforms/api.ts` | Connect/list/remove on **web-backend**. |
| `features/platforms/types.ts` | Platform/connection DTOs. |
| `features/profile/api.ts` | `GET /api/public/:username` on **web-backend** (no auth). |
| `features/profile/types.ts` | Public profile DTOs. |
| `features/sync/api.ts` | Connect/trigger/status on **git-service**. |
| `features/sync/types.ts` | Sync request/status DTOs. |
| `hooks/useStats.ts` | Load/cache dashboard stats. |
| `hooks/usePlatforms.ts` | List/connect/remove platforms. |
| `lib/api-client.ts` | HTTP wrapper supporting **two base URLs** (web-backend + git-service); attach auth, parse JSON, throw typed errors. |
| `lib/utils.ts` | classnames + formatting helpers. |
| `types/index.ts` | Shared frontend types barrel. |
| `constants/platforms.ts` | Per‑platform metadata (name, icon, color, profile URL). |
| `styles/theme.ts` | Design tokens usable from TS. |

---

# 🧩 BROWSER EXTENSION  (`browser-extension/`)

Path B v2 — capture the user's **own accepted** code in-browser and feed git-service. Signs in as the **same CodeVault user**. Cross-browser (Manifest V3 + `webextension-polyfill`). Full blueprint: [docs/EXTENSION_PLAN.md](docs/EXTENSION_PLAN.md); security: [docs/EXTENSION_SECURITY.md](docs/EXTENSION_SECURITY.md).

## Backend support first (Phase 9)
| File | What to write |
|------|---------------|
| `web-backend/src/routes/auth.routes.ts` (extend) | `POST /auth/extension/start` (PKCE + `client=extension`), `POST /auth/extension/token`, `POST /auth/extension/refresh`, `GET /auth/extension/sessions`, `DELETE /auth/extension/sessions/:id`. |
| `web-backend/src/services/auth.service.ts` (extend) | Issue/rotate a `client=extension` session (reuse rotation + reuse-detection); list/revoke sessions. |
| `web-backend/prisma/schema.prisma` (extend) | Add `client` discriminator (`web` \| `extension`) to `auth_sessions`; optional `ingest_log` (idempotency). |
| `git-service/src/routes/ingest.routes.ts` | `POST /api/ingest` — accept captured submission(s). |
| `git-service/src/controllers/ingest.controller.ts` | Validate (Zod), verify JWT (reuse S1), ownership-check, dedupe vs `problems`, call existing GitHub push. |

## Extension root config (Phase 10)
| File | What to write |
|------|---------------|
| `browser-extension/package.json` | Deps (`webextension-polyfill`, `zod`) + build (WXT or CRXJS+Vite). Scripts: `dev`, `build:chrome`, `build:firefox`, `build:safari`. |
| `browser-extension/tsconfig.json` | Strict TS, `@/*` alias to `src/`. |
| `browser-extension/manifest.config.ts` | MV3; `host_permissions` = 4 platforms + API domain; `permissions` = storage/scripting/identity; strict CSP. |
| `browser-extension/.env.example` | Public API base URLs only (no secrets). |

## Background / Content / UI
| File | What to write |
|------|---------------|
| `src/background/index.ts` | Sole token holder; receives validated capture messages; dispatches `POST /api/ingest`. |
| `src/content/leetcode.ts` | Detect Accepted (intercept submission-check response; DOM fallback); extract number/slug/title/difficulty/tags/language/code. |
| `src/content/codeforces.ts` · `codechef.ts` · `hackerrank.ts` | Same per platform. |
| `src/popup/` | Sign-in status, per-platform auto-capture toggles, recent captures, "Sync now," dashboard link. |
| `src/options/` | Account, capture prefs, target repo, revoke sessions. |

## Lib / Types / Constants
| File | What to write |
|------|---------------|
| `src/lib/auth.ts` | PKCE OAuth handoff (`launchWebAuthFlow`), token storage + rotation in `chrome.storage.local`. |
| `src/lib/api-client.ts` | Two base URLs (web-backend auth + git-service ingest); attach Bearer JWT. |
| `src/lib/capture.ts` | Shared normalize → `SolutionToSync` (mirror git-service types). |
| `src/lib/storage.ts` | `chrome.storage.local` wrappers. |
| `src/types/index.ts` | `Submission`, `Capture`, `SolutionToSync`. |
| `src/constants/index.ts` | Platform host patterns + capture selectors/endpoints. |

---

## ✅ Definition of done (per file)

A file is "done" when it: implements the responsibility above, exports a clean typed interface, contains no logic that belongs in another layer or service, reads secrets only from env, and is covered by at least a basic test where it holds logic (services, generators, utils).
