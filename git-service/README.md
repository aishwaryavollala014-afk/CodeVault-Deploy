<div align="center">

# 📦 CodeVault — Git Service

### The dedicated GitHub‑sync backend.

A standalone **Node.js + Express + TypeScript** service whose only job is to fetch a user's accepted solutions, organize them, and push them to their GitHub repo. The [web‑frontend](../web-frontend) calls this service directly to manage sync.

</div>

---

## 📑 Table of Contents

1. [Responsibility](#-responsibility)
2. [Where it sits](#-where-it-sits)
3. [Tech stack & versions](#-tech-stack--versions)
4. [Folder structure](#-folder-structure)
5. [File‑by‑file guide](#-file-by-file-guide)
6. [API endpoints](#-api-endpoints)
7. [Synced repo layout (output)](#-synced-repo-layout-output)
8. [Background jobs](#-background-jobs)
9. [Rules & conventions](#-rules--conventions)
10. [Getting started](#-getting-started)

---

## 🎯 Responsibility

The git‑service owns **Path B** (authorized code sync) end‑to‑end:

- Fetch the authorized user's recent **accepted submissions + source code**.
- Fetch each problem's **statement** for `question.md`.
- Organize and **push** a folder named by the problem number to the user's GitHub repo.
- Regenerate the repo's **index README**.
- Run the **scheduled sync** automatically.

It does **not** handle the website's stats, auth, or profiles — that's the [web‑backend](../web-backend).

---

## 🧭 Where it sits

```
web-frontend ──REST──▶ web-backend   (auth, stats, public profiles)
             └─REST──▶ git-service   (this service: sync code to GitHub)
                              │
                              ▼
                  Platform APIs  +  GitHub REST API
```

The frontend talks to this service directly to connect a platform for sync, trigger a sync, and read sync status.

---

## 🛠 Tech stack & versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | **Node.js** | `≥ 18.18` |
| Language | **TypeScript** | `5.5.x` |
| Framework | **Express** | `4.19.x` |
| ORM | **Prisma** | `5.18.x` |
| Scheduling | **node-cron** | `3.x` |
| HTTP client | **axios** | `1.x` |
| Logging | **pino** | `9.x` |
| GitHub | **GitHub REST API** | v3 |

---

## 📁 Folder structure

```
git-service/
├── package.json
├── tsconfig.json
├── .env.example                 # GITHUB_TOKEN, platform sessions, INTERNAL_API_KEY…
├── .gitignore
├── nodemon.json
│
├── prisma/
│   └── schema.prisma            # synced-problem tracking
│
├── tests/
│   └── .gitkeep
│
└── src/
    ├── index.ts                 # entry: load env, start server + scheduler
    ├── app.ts                   # Express app (middlewares + routes)
    ├── server.ts                # HTTP server + graceful shutdown
    │
    ├── config/
    │   ├── index.ts
    │   └── env.ts               # validated environment
    │
    ├── routes/
    │   ├── index.ts             # mounts routes under /api
    │   └── sync.routes.ts       # /api/sync (trigger + status)
    │
    ├── controllers/
    │   └── sync.controller.ts   # HTTP handling for sync
    │
    ├── services/
    │   ├── sync.service.ts      # orchestrate: fetch code + question → push → index
    │   ├── submissions/         # authorized code/question fetchers
    │   │   ├── index.ts         # registry by platform
    │   │   ├── leetcode.service.ts
    │   │   └── codeforces.service.ts
    │   └── github/
    │       ├── github.service.ts      # create folder + commit question.md + solution
    │       └── readme.generator.ts    # build repo index README
    │
    ├── middlewares/
    │   ├── auth.middleware.ts   # verify internal API key from web-backend/frontend
    │   ├── error.middleware.ts
    │   └── rateLimit.middleware.ts
    │
    ├── jobs/
    │   ├── scheduler.ts         # register cron jobs at boot
    │   └── sync.job.ts          # periodic auto-sync
    │
    ├── lib/
    │   ├── prisma.ts
    │   ├── logger.ts
    │   └── httpClient.ts
    │
    ├── types/
    │   ├── index.ts
    │   └── sync.types.ts        # Submission, Question, SolutionToSync
    │
    └── utils/
        ├── errors.ts
        └── helpers.ts           # pad number, slugify, language → extension
```

---

## 📄 File‑by‑file guide

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry — load env, start server, register the scheduler. |
| `src/app.ts` | Build the Express app; apply middlewares; mount routes. |
| `src/server.ts` | Start the listener; graceful shutdown. |
| `config/env.ts` | Read & validate env (GitHub token, platform sessions, internal key). |
| `routes/sync.routes.ts` | `POST /sync` (run), `GET /sync/status` (per user). |
| `controllers/sync.controller.ts` | Parse request, call `sync.service`, return a summary. |
| `services/sync.service.ts` | Orchestrate: fetch new accepted submissions + question, diff, push folder per problem number, regenerate index README, update DB. |
| `services/submissions/index.ts` | Registry mapping a platform name to its submission fetcher. |
| `services/submissions/leetcode.service.ts` | Authorized fetch of accepted submissions + source code + question statement. |
| `services/submissions/codeforces.service.ts` | Fetch accepted submissions (where available) for sync. |
| `services/github/github.service.ts` | Create `<number>/question.md` + `<number>/solution.<ext>` and commit them. |
| `services/github/readme.generator.ts` | Build the repo's index README table. |
| `middlewares/auth.middleware.ts` | Verify the internal API key so only trusted callers sync. |
| `middlewares/error.middleware.ts` | Consistent JSON error formatting. |
| `middlewares/rateLimit.middleware.ts` | Throttle requests. |
| `jobs/scheduler.ts` | Register cron jobs on boot. |
| `jobs/sync.job.ts` | Periodic auto-sync for every active connection. |
| `lib/prisma.ts` | Shared Prisma client. |
| `lib/logger.ts` | Configured pino logger. |
| `lib/httpClient.ts` | Pre-configured axios instance. |
| `types/sync.types.ts` | `Submission`, `Question`, `SolutionToSync` interfaces. |
| `utils/errors.ts` | Typed errors (incl. `ExpiredSessionError`). |
| `utils/helpers.ts` | Pad problem numbers, slugify, language → file extension. |

---

## 🌐 API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sync` | Trigger a sync run for a user/connection. |
| `GET`  | `/api/sync/status` | Sync status (synced count, last run, expiry). |

> Protected by an internal API key (`auth.middleware`).

---

## 📂 Synced repo layout (output)

```
<problem-number>/
├── question.md          # statement: title, difficulty, tags, link, description
└── solution.<ext>       # the user's accepted code
```

Plus a top‑level `README.md` index regenerated after each run.

---

## ⏰ Background jobs

`scheduler.ts` registers cron jobs at boot; `sync.job.ts` periodically syncs every active connection and flags any with an expired session.

---

## 📐 Rules & conventions

1. **Single responsibility** — this service only syncs code to GitHub; nothing else.
2. **Internal access only** — protected by an internal API key; not a public API.
3. **Consent & own‑data‑only** — fetches only the authorized user's own submissions.
4. **Secrets only in `.env`** — never commit tokens.
5. **Graceful expiry** — surface expired sessions instead of failing silently.
6. **Commits:** small, prefixed; authored solely by the project owner — no co‑authors.

---

## 🚀 Getting started

```bash
cd git-service
npm install
cp .env.example .env          # GITHUB_TOKEN, platform sessions, INTERNAL_API_KEY
npx prisma db push
npm run dev                   # service on http://localhost:5000
```
