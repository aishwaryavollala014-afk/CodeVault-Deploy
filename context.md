# 🧠 CodeVault — Project Context (AI Handoff)

> Single‑file context so any AI (or person) can understand the whole project and continue the work. Read this first, then [plan.md](plan.md) for the per‑file build spec.

---

## 1. One‑line summary

**CodeVault** unifies a user's competitive‑programming progress (LeetCode, CodeChef, Codeforces, HackerRank) into one **analytics website**, and **auto‑syncs their accepted solutions to a GitHub repository** — organized so anyone can search a problem and see how they solved it.

---

## 2. The idea & origin (what the user wants)

The user's core vision, in their words:
- When they solve/submit a problem on any coding platform, the solution should **automatically appear in a linked GitHub repo** (e.g. `LeetCodeQuestions`).
- In that repo, **each problem is a folder named by its problem number** (e.g. `0369/`), containing **the question** (`question.md`) and **their answer** (`solution.<ext>`).
- So when someone searches "LeetCode 369", they find the repo, open `0369/`, and see the question + exactly how it was solved.
- **Separately**, there should be a **website showing the user's total analysis** across all platforms (a dashboard + a public shareable profile).
- Starting platforms: **LeetCode, CodeChef, Codeforces, HackerRank** — more may be added later.

User constraints stated during discussion:
- ⚠️ **Originally "no browser extension"** — this constraint was **later reversed** (the user decided to add a cross-browser extension). The extension is **Path B v2 (capture-at-source)**: because the user is already signed in to the platform in their own browser, it captures their own accepted code at solve-time and feeds git-service — fixing the fragility of server-side session replay. Stats (Path A) stay username-only and need no extension. See [docs/EXTENSION_PLAN.md](docs/EXTENSION_PLAN.md) and [browser-extension/README.md](browser-extension/README.md).
- ❌ No pasting code per problem.
- ✅ Accepted a **one‑time authorized connect** per platform for code sync (extension preferred over server-side session replay).

---

## 3. Hard technical facts (established via research)

These are settled and must be respected:
- A **username/profile link only exposes PUBLIC data**: stats, solved list, difficulty/topic breakdown, rankings, heatmap. **NOT source code.**
- **LeetCode submitted code is private** — only retrievable with the user's own authenticated session. There is **no username‑only way** to get code.
- **Codeforces** official API (`user.status?handle=`) returns submission metadata but **not source code** (scraping it violates ToS).
- Therefore: **stats = username only; code = one‑time authorized connect.** This split is the foundation of the whole architecture.

---

## 4. Product = two separate deliverables

1. 🌐 **Analytics website** — works from a **username alone** (public stats). Has a private **dashboard** (`/dashboard`) and a public **shareable profile** (`/u/[username]`).
2. 📦 **Auto‑synced GitHub repo** — needs the **one‑time connect** (private code). Folder per problem number with `question.md` + `solution.<ext>` + an auto‑generated index `README.md`.

The two data paths:
- **Path A (Stats):** username → public endpoints → dashboard. No auth.
- **Path B (Code):** one‑time authorized session → user's own accepted submissions + code → GitHub. Auth once; sessions expire → app prompts a clean reconnect.
- **Path B v2 (Code, via extension):** the cross-browser extension captures the user's own accepted code in-browser at solve-time and posts it to git-service `POST /api/ingest` (signed in as the **same CodeVault user**). Preferred over server-side session replay; reuses git-service's existing GitHub push unchanged.

---

## 5. Architecture — 3‑service monorepo (+ cross-browser extension)

```
web-frontend ──REST──▶ web-backend   (auth, stats, public profiles)
             └─REST──▶ git-service   (sync solution code to GitHub)
```

The **frontend talks to BOTH backends directly** (decision made by the user).

| Service | Folder | Stack | Responsibility |
|---------|--------|-------|----------------|
| Web Frontend | `web-frontend/` | Next.js 15, React 18.3, Tailwind 3.4, TS 5.5 | Website UI: landing, dashboard, connect, public profile. Calls both backends. |
| Web Backend | `web-backend/` | Express 4.19, Prisma 5.18, Zod, TS 5.5, Node ≥18.18 | Auth (GitHub OAuth), platform connections, multi‑platform **stats** aggregation (Path A), public profiles. |
| Git Service | `git-service/` | Express 4.19, Prisma 5.18, node‑cron, axios, pino | **Path B**: fetch authorized code + question, push per‑problem folder to GitHub, regenerate index, scheduled syncs. Internal‑API‑key protected. |
| Browser Extension | `browser-extension/` | Manifest V3, TypeScript, WebExtensions API | **Path B v2**: capture the user's own accepted code in-browser, sign in as the same CodeVault user (JWT), post to git-service `POST /api/ingest`. Cross-browser (Chrome/Edge/Brave/Opera/Firefox; Safari later). |

Env wiring: frontend uses `NEXT_PUBLIC_API_URL` (web-backend) and `NEXT_PUBLIC_GIT_SERVICE_URL` (git-service). Dev ports: web-backend `4000`, git-service `5000`, frontend `3000`.

> 📌 **Canonical tech stack: [docs/TECH_STACK.md](docs/TECH_STACK.md)** (upgraded 2026-06-28 → Node 20, Express 5, Tailwind 4, +TanStack Query). Version numbers elsewhere in older docs defer to it.

---

## 6. Repo / folder structure (top level)

```
CodeVault/
├── README.md          # monorepo overview
├── plan.md            # per-file build spec (THE blueprint)
├── context.md         # this file
├── docs/ARCHITECTURE.md   # (currently empty skeleton)
├── frontendHtml/      # ✅ clickable HTML prototype, 15 pages (see frontendHtml/README.md)
├── web-frontend/      # Next.js UI skeleton (see web-frontend/README.md)
├── web-backend/       # website API skeleton (see web-backend/README.md)
├── git-service/       # GitHub sync skeleton (see git-service/README.md)
└── browser-extension/ # cross-browser extension skeleton — Path B v2 (see browser-extension/README.md)
```

Each service has its own README documenting structure, versions, file‑by‑file purpose, and rules. `plan.md` says **what code to write in every file**.

---

## 7. Current status

- ✅ **Backend/Next.js = skeleton only.** Every planned file in `web-backend/`, `git-service/`, `web-frontend/` exists but is **empty** (no app code yet) — the structure + READMEs + `plan.md` are the source of truth.
- ✅ **Full HTML prototype committed** in **`frontendHtml/`** — 15 clickable pages (landing, login, overview, analytics, repositories, public-profile, sync-status, settings, notifications, connect, problem, public profile view, privacy, terms, contact). Every button is wired. See `frontendHtml/README.md`. Pricing page was created then **removed** (to be added later).
- ✅ Repo on GitHub: **https://github.com/Gaurav06120714/CodeVault** (branch `main`).
- ⏳ **No backend/Next.js code implemented yet.** Next step: build the real Next.js pages from the prototype, then `plan.md` Phase 1.
- 🧩 **Browser extension = planned, docs only.** `browser-extension/` holds a planning README; full blueprint in [docs/EXTENSION_PLAN.md](docs/EXTENSION_PLAN.md) + security in [docs/EXTENSION_SECURITY.md](docs/EXTENSION_SECURITY.md). No extension code yet.
- ♻️ **2026-06-27: all three services reset to empty skeletons.** Implementation preserved in docs — schema in [docs/DATABASE_PLAN.md](docs/DATABASE_PLAN.md) §17, file interfaces in [docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md) §15, env contract in [docs/SECRETS.md](docs/SECRETS.md) §14 (and full source in git history).

---

## 8. Conventions & rules (MUST follow)

1. **Git commits authored solely by the user — NO Claude/AI co‑author trailer.** Git identity: name `Gaurav06120714`, email `gauravganeshteegulla@gmail.com`.
2. **Commit per file / per logical change**, with prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`. The user likes granular history.
3. **Push after committing** — the user often says "push one by one after creating each file", so commit + push per file.
4. **Strict layering** in backends: Routes (wiring) → Controllers (HTTP I/O) → Services (logic) → Integrations/DB. Controllers never touch the DB.
5. **One integration per file** (one platform = one service file).
6. **Secrets only in `.env`**; each service has its own `.env.example`. Never commit tokens.
7. **`@/` import alias** points to `src/` in every service.
8. **Consent & own‑data‑only** — only ever access the user's own data, with authorization.
9. **Graceful expiry** — when a session expires, show "Reconnect"; the stats dashboard keeps working regardless.

---

## 9. Build order (from plan.md)

1. web-backend foundation (config, lib, types, utils, prisma)
2. web-backend platform **stats** + stats service
3. web-backend auth + API layer + public profile
4. git-service foundation
5. git-service submission/code + question fetchers, GitHub push, sync service
6. git-service automation (scheduler + sync job) + sync API
7. web-frontend foundation (api-client with 2 bases, types, constants, styles, features)
8. web-frontend UI (components, pages, hooks) incl. dashboard + public profile + sync

---

## 10. How to continue the conversation

- The user builds incrementally and wants **per‑file commits, no AI co‑author**.
- When implementing, follow `plan.md` exactly; keep each service self‑contained.
- The design language for UI: see `frontendHtml/` (warm paper `#f8f6f1`; **coral `#f1543f`** primary + **gold `#e8a200`** + **rose `#e0457b`** accents; NO purple/blue/green theme; Inter + JetBrains Mono; consistent inline-SVG icons, no emoji; platform badges keep real brand colors). The user rejected purple, blue, and green themes.
- Likely next request: convert the `frontendHtml/` prototype pages into real `web-frontend/src/app` Next.js pages/components (1:1 mapping).
- Platforms to support first: **LeetCode, CodeChef, Codeforces, HackerRank**; designed so adding more later = adding one service file per platform.

---

## 11. Key references

- Repo: https://github.com/Gaurav06120714/CodeVault
- Build spec: [plan.md](plan.md)
- Service docs: [web-frontend/README.md](web-frontend/README.md) · [web-backend/README.md](web-backend/README.md) · [git-service/README.md](git-service/README.md)
- Architecture & plans: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/API_CONTRACT.md](docs/API_CONTRACT.md) · [docs/DATABASE_PLAN.md](docs/DATABASE_PLAN.md) · [docs/ROADMAP.md](docs/ROADMAP.md)
- **Security documentation (18 enterprise guides):** [docs/SECURITY_PLAN.md](docs/SECURITY_PLAN.md) plus per-domain guides — DATABASE, BACKEND, AUTH, API, REDIS, QUEUE, GITHUB, INFRASTRUCTURE, CLOUD, MONITORING, DEVSECOPS, FILE_UPLOAD, SECRETS, SCALABILITY, DISASTER_RECOVERY, SECURITY_TESTING, COMPLIANCE, and [docs/ATTACK_PREVENTION.md](docs/ATTACK_PREVENTION.md). Full index in [README.md](README.md#-documentation).
- Sample UI: `web-frontend/landing-example.html` (uncommitted)
