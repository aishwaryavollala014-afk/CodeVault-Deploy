# 👥 CodeVault — Team Plan & Work Split

> Hey Gaurav! Read this fully before we start coding. This covers our work split, the updated tech stack, and what we both need to agree on before writing the first line of code.

---

## 🗂️ Who Builds What

| Developer | Service | Folder | What it does |
|-----------|---------|--------|--------------|
| **Aishwarya** | Web Backend | `web-backend/` | GitHub OAuth login, platform connections, stats aggregation from LeetCode/CF/CC/HR, public profiles |
| **Gaurav** | Git Service | `git-service/` | Fetches accepted code from platforms, pushes it to GitHub as organized folders, BullMQ jobs, auto-sync scheduler |
| **Both of us** | Web Frontend | `web-frontend/` | Next.js UI — after both backends are done, we build this together |

**Golden rule: stay in your own folder. Never touch each other's service.**

---

## 📋 The Build Plan

```
Phase 1 (Now — Parallel):
  Aishwarya → web-backend/   (foundation → stats → auth → routes)
  Gaurav    → git-service/   (foundation → fetchers → GitHub push → jobs)

Phase 2 (After both backends are done):
  Both  → web-frontend/  (convert frontendHtml/ prototype into real Next.js pages)
```

No one waits for the other. We build at the same time.

---

## 🔄 Updated Tech Stack (4 Changes from Original)

I reviewed the original tech stack and found these need to be updated. **Both of us must use the same versions.**

| Original | Updated | Why |
|----------|---------|-----|
| `Node.js ≥ 18.18` | **Node.js ≥ 20.x LTS** | Node 18 reaches end-of-life April 2025 |
| `Express 4.19.x` | **Express 5.x** | Async errors are caught automatically — no manual `try/catch + next(err)` on every route |
| `Tailwind CSS 3.4.x` | **Tailwind CSS 4.x** | Stable since 2025, faster, no JS config file needed |
| React Query *(missing)* | **TanStack Query 5.x** | Was in the original spec images but missing from plan — added now |

> Full updated tech stack is documented in `docs/TECH_STACK.md` — read it.

### Why Express 5 matters for your git-service:

```typescript
// Express 4 (old) — you'd need this on EVERY route:
router.post('/sync', async (req, res, next) => {
  try {
    await syncService.run(req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err); // easy to forget, causes silent crashes
  }
});

// Express 5 (new) — async errors caught automatically:
router.post('/sync', async (req, res) => {
  await syncService.run(req.user.id);
  res.json({ ok: true }); // if this throws, Express 5 handles it
});
```

---

## ⚠️ 4 Things We Must Agree On Before Starting

**Reply to Aishwarya confirming these before either of us writes code:**

1. ☐ **Work split confirmed** — Gaurav: `git-service/`. Aishwarya: `web-backend/`. Both: `web-frontend/` later.
2. ☐ **Tech stack aligned** — Both use Express 5, Node 20, same dependency versions.
3. ☐ **API Contract read** — Both of us have read `docs/API_CONTRACT.md`. Any changes to endpoints must be discussed first.
4. ☐ **Git workflow** — Always `git pull origin main` before starting work. Always `git pull --rebase origin main` before pushing. Commit small with prefixes (`feat:`, `fix:`, `chore:`, `docs:`).

---

## 🗂️ What Gaurav is Building — git-service/ Explained

Gaurav's service owns **Path B** — taking a user's authorized coding session, fetching their accepted code, and pushing it to GitHub as organized folders.

### Gaurav's build order (recommended):

**Phase 1 — Foundation**
| # | File | What to write |
|---|------|--------------|
| 1 | `package.json` | Dependencies: express@5, prisma, axios, node-cron, bullmq, ioredis, pino, zod, dotenv |
| 2 | `tsconfig.json` | Strict TS config, `@/*` alias to `src/` |
| 3 | `nodemon.json` | Watch `src/`, run via tsx |
| 4 | `.env.example` | PORT, DATABASE_URL, GITHUB_TOKEN, GITHUB_SYNC_REPO, INTERNAL_API_KEY, SYNC_INTERVAL_MINUTES, LOG_LEVEL |
| 5 | `prisma/schema.prisma` | SyncedProblem model: connectionRef, platform, problemNumber, slug, language, syncedToGit, syncedAt |
| 6 | `src/config/env.ts` | Read + validate env with Zod |
| 7 | `src/lib/prisma.ts` | Single shared Prisma client |
| 8 | `src/lib/logger.ts` | pino logger |
| 9 | `src/lib/httpClient.ts` | Configured axios instance |
| 10 | `src/lib/redis.ts` | Shared ioredis client |

**Phase 2 — Submission Fetchers**
| # | File | What to write |
|---|------|--------------|
| 11 | `src/services/submissions/leetcode.service.ts` | Fetch user's accepted LeetCode submissions + code (needs auth token) |
| 12 | `src/services/submissions/codeforces.service.ts` | Fetch accepted Codeforces submissions |
| 13 | `src/services/submissions/codechef.service.ts` | Fetch accepted CodeChef submissions |
| 14 | `src/services/submissions/hackerrank.service.ts` | Fetch accepted HackerRank submissions |

**Phase 3 — GitHub Publishing**
| # | File | What to write |
|---|------|--------------|
| 15 | `src/services/github/github.service.ts` | GitHub API calls — create/update files in user's repo |
| 16 | `src/services/github/readme.generator.ts` | Auto-generates the README index table of all solved problems |
| 17 | `src/services/problem.service.ts` | Formats a problem into `question.md` content |
| 18 | `src/services/repo.service.ts` | Manages repo structure (folder names, file paths) |
| 19 | `src/services/sync.service.ts` | Orchestrates everything: fetch → format → push → update DB |

**Phase 4 — Background Jobs**
| # | File | What to write |
|---|------|--------------|
| 20 | `src/jobs/queue.ts` | BullMQ queue setup on Redis |
| 21 | `src/jobs/sync.job.ts` | BullMQ worker — runs sync logic in the background with retries |
| 22 | `src/jobs/scheduler.ts` | node-cron — enqueues a BullMQ job every N hours |

> **Important:** `scheduler.ts` must only **enqueue** a BullMQ job. Never run sync logic inline. If the server crashes mid-sync, Redis retries the job automatically.

**Phase 5 — API Layer**
| # | File | What to write |
|---|------|--------------|
| 23 | `src/routes/sync.routes.ts` | POST /api/sync/trigger, GET /api/sync/status |
| 24 | `src/controllers/sync.controller.ts` | Read request, call sync service, return JSON |
| 25 | `src/middlewares/internalKey.middleware.ts` | Verify INTERNAL_API_KEY header (only frontend can call this) |
| 26 | `src/app.ts` | Setup Express app |
| 27 | `src/server.ts` | Listen on port 5000, graceful shutdown |
| 28 | `src/index.ts` | Entry point — start server + register scheduler |

---

## 🔗 How Our Services Connect

```
Aishwarya's web-backend  ──provides user auth + stats──▶  web-frontend (both build later)
Gaurav's git-service ──sync status + trigger────────▶  web-frontend (both build later)
```

The frontend calls both our services. Our services don't call each other directly.

---

## 📐 Shared Rules (From context.md — must follow)

1. **No AI co-author** in commits — `git commit` is authored only by you (`gauravganeshteegulla@gmail.com`)
2. **One file per commit** — commit and push after completing each file
3. **Strict layering** — Routes → Controllers → Services → DB. Controllers never touch the DB directly.
4. **One platform per file** — LeetCode gets its own file, Codeforces gets its own file, etc.
5. **Secrets only in `.env`** — never commit real tokens. Use `.env.example` as the template.
6. **`@/` alias** — always import using `@/` which maps to `src/`

---

## 🚀 How to Start

```bash
# 1. Pull latest (always first)
git pull origin main

# 2. Start coding your first file
# git-service/package.json

# 3. After each file:
git pull --rebase origin main
git add git-service/<filename>
git commit -m "feat: add git-service/package.json"
git push origin main
```

---

## ✅ Confirm and Let's Go

Reply to Aishwarya with:
- ✅ Work split agreed
- ✅ Tech stack aligned
- ✅ API contract read
- ✅ Starting now

Then we both start building in parallel. 🚀
