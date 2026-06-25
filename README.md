<div align="center">

# 🗄️ CodeVault

### Your entire coding journey — unified, organized, and automated.

CodeVault brings every competitive‑programming platform you use into **one dashboard**, and automatically publishes your accepted solutions to a **clean, searchable GitHub repository** — no browser extension, no copy‑pasting code for every problem.

</div>

---

## 📑 Table of Contents

1. [What is CodeVault?](#-what-is-codevault)
2. [Monorepo layout](#-monorepo-layout)
3. [Core features](#-core-features)
4. [How it works — the two data paths](#-how-it-works--the-two-data-paths)
5. [Tech stack & versions](#-tech-stack--versions)
6. [Project rules & conventions](#-project-rules--conventions)
7. [Getting started](#-getting-started)
8. [Roadmap](#-roadmap)
9. [Ethics & limitations](#-ethics--limitations)
10. [Author](#-author)

---

## 🧩 What is CodeVault?

When you solve problems on LeetCode, Codeforces, CodeChef, or HackerRank, all that hard work stays trapped — split across different sites, hidden behind logins, and impossible to show off in one place.

**CodeVault fixes that.** It delivers **two separate things**:

1. 🌐 **An analytics website** — your own page that pulls **public stats** from every platform into one place, showing your *total* analysis across all of them. It can be viewed privately on your dashboard and shared publicly by username (`/u/your-name`), like a coding profile.
2. 📦 **An auto‑synced GitHub repo** — your **accepted solutions** are automatically organized into a GitHub repo with an auto‑generated index, so anyone (a recruiter, a friend, or future‑you) can search a problem and instantly see how you solved it.

> These two are independent: the website works from a **username alone** (stats), while the code repo needs a **one‑time connect** (your private solution code).

> 📌 This repository is a **monorepo skeleton** — the full folder structure with an empty file for every planned module. Code is added module‑by‑module. The READMEs are the single source of truth for the architecture.

---

## 🗂 Monorepo layout

CodeVault is split into **three independent applications** — one UI and two separate backends:

```
CodeVault/
├── README.md          # ← you are here (project overview)
├── plan.md            # build spec for every file
├── context.md         # AI handoff / full project context
├── .gitignore
│
├── docs/
│   └── ARCHITECTURE.md   # shared architecture deep-dive
│
├── frontendHtml/      # 🎨 Clickable HTML/CSS/JS prototype (15 pages)  →  see frontendHtml/README.md
│
├── web-frontend/      # 🖥️ Next.js website UI (production build)       →  see web-frontend/README.md
│   └── src/ ...
│
├── web-backend/       # 🌐 website API: auth, stats, profiles  →  see web-backend/README.md
│   └── src/ ...
│
└── git-service/       # 📦 GitHub-sync backend: fetch code + push  →  see git-service/README.md
    └── src/ ...
```

| Part | Stack | What it does | Docs |
|-----|-------|--------------|------|
| **frontendHtml/** | static HTML · CSS · JS | Clickable prototype of every screen; the visual spec for the real UI | [frontendHtml/README.md](frontendHtml/README.md) |
| **web-frontend/** | Next.js 15 · React 18 · Tailwind | Production website UI; connect platforms, view analysis, public profiles | [web-frontend/README.md](web-frontend/README.md) |
| **web-backend/** | Node.js · Express · Prisma | Auth, platform connections, multi‑platform stats, public profiles | [web-backend/README.md](web-backend/README.md) |
| **git-service/** | Node.js · Express · Prisma · node‑cron | Fetches the user's code + question, pushes the per‑problem folder to GitHub, runs scheduled syncs | [git-service/README.md](git-service/README.md) |

> 🎨 **Design language:** warm "paper" background with a **coral `#f1543f` + gold `#e8a200` + rose `#e0457b`** mix (no purple/blue/green theme). Inter + JetBrains Mono. See the live look in [frontendHtml/](frontendHtml/README.md).

### How they connect

The **web‑frontend talks to both backends** directly over REST:

```
web-frontend ──REST──▶ web-backend   (auth, stats, public profiles)
             └─REST──▶ git-service   (sync solution code to GitHub)
```

- The **web‑backend** powers the analytics website (works from a **username alone**).
- The **git‑service** is a dedicated, separate backend for GitHub sync (needs the **one‑time connect**), so syncing scales and fails independently of the website.

---

## ✨ Core features

- 📊 **Unified analytics dashboard** — every platform in one view: total solved, difficulty & topic breakdown, language usage, streaks, rankings, activity heatmap, and progress over time.
- 🔄 **Auto‑sync to GitHub** — the moment you solve a problem, it is pushed to your linked repo as a **folder named by its problem number**, holding the **question** and your **answer**, plus an auto‑updated README index.
- 🔐 **Connect once, automate forever** — authorize a platform a single time; syncing then runs on a schedule.
- 🤖 **(Planned) AI layer** — auto‑explain solutions, auto‑tag problem type, recommend the next problem by your weakest topic.

---

## 📂 How your synced repo looks

When you solve a problem, CodeVault auto‑commits it to your linked repo (for example `LeetCodeQuestions`). **Each problem becomes a folder named by its problem number**, containing both the **question** and your **answer**:

```
LeetCodeQuestions/
├── README.md                  # auto-generated index of every solved problem
├── 0001/
│   ├── question.md            # the problem statement
│   └── solution.py            # your accepted solution
├── 0369/
│   ├── question.md
│   └── solution.cpp
└── 0704/
    ├── question.md
    └── solution.java
```

- **Folder name = problem number** (zero‑padded) so problems sort naturally.
- `question.md` — the problem statement: title, difficulty, topic tags, link, and description.
- `solution.<ext>` — your accepted code, in the language you solved it in.
- The top‑level `README.md` is an auto‑updated table indexing every solved problem.

> So when someone searches "LeetCode 369", they land on `0369/` and instantly see the question **and** exactly how you solved it.

---

## 🧠 How it works — the two data paths

CodeVault is built on one key insight: **public stats and private source code are two different kinds of data**, so they travel two independent paths. If one breaks, the other still works.

### Path A — Statistics *(username only)*
- **Input:** a public username / profile link.
- **Source:** public endpoints (LeetCode GraphQL, Codeforces official API…).
- **Auth:** none. Always available, fully legal .

### Path B — Code sync *(one‑time authorized connect)*
- **Input:** an authorized session you grant **once** per platform.
- **Source:** *your own* accepted submissions, including source code.
- **Auth:** required once — syncing is automatic thereafter.

```
Public username ───▶ Stats Poller ──────────▶ Unified Dashboard
One-time connect ──▶ Submission Fetcher ──▶ Organizer ──▶ GitHub API ──▶ Public Repo + README
```

> ⚠️ **Honest truth:** a username alone can fetch *stats* but **never your source code** — submitted code is private on every platform. Path B exists precisely to solve that, with your explicit consent, touching only your own data.

---

## 🛠 Tech stack & versions

| App | Technology | Version |
|-----|-----------|---------|
| web-frontend | **Next.js** (App Router) · **React** · **Tailwind CSS** | `15.x` · `18.3.x` · `3.4.x` |
| web-backend | **Express** · **Prisma** · **Zod** | `4.19.x` · `5.18.x` · `3.x` |
| git-service | **Express** · **Prisma** · **node-cron** · **axios** | `4.19.x` · `5.18.x` · `3.x` · `1.x` |
| Shared | **TypeScript** · **Node.js** | `5.5.x` · `≥ 18.18` |
| Database | **SQLite** (dev) → **PostgreSQL** (prod) | — |

> Per‑app details live in [web-frontend/README.md](web-frontend/README.md), [web-backend/README.md](web-backend/README.md), and [git-service/README.md](git-service/README.md).

---

## 📐 Project rules & conventions

1. **Clear separation** — UI in `web-frontend/`, website logic in `web-backend/`, GitHub sync in `git-service/`. The frontend calls both backends over REST.
2. **Each app is self‑contained** — its own `package.json`, config, and README.
3. **Two data paths stay separate** — public stats (Path A) never depend on an authorized session (Path B).
4. **Secrets only in `.env`** — never commit real tokens; each app has its own `.env.example`.
5. **Consent first** — the app only ever accesses the user's *own* data, with explicit authorization.
6. **Commit style:** small, focused commits with prefixes — `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`.
7. **Author attribution:** every commit is authored solely by the project owner — **no co‑authors**.

---

## 🚀 Getting started

```bash
# 1) Web backend (website API)
cd web-backend
npm install && cp .env.example .env && npx prisma db push
npm run dev          # http://localhost:4000

# 2) Git service (sync engine) — new terminal
cd git-service
npm install && cp .env.example .env && npx prisma db push
npm run dev          # http://localhost:5000

# 3) Web frontend (UI) — new terminal
cd web-frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
                             # NEXT_PUBLIC_GIT_SERVICE_URL=http://localhost:5000
npm run dev          # http://localhost:3000
```

---

## 🗺 Roadmap

- [x] Monorepo skeleton (web-frontend + web-backend + git-service) & architecture
- [x] HTML prototype of every screen (`frontendHtml/`) + design system
- [ ] web-backend: LeetCode stats (Path A)
- [ ] web-backend: Codeforces stats (official API)
- [ ] git-service: LeetCode code sync (Path B) → GitHub push + README index
- [ ] web-frontend: build real pages from the prototype
- [ ] Pricing / plans page (deferred)
- [ ] Unified multi‑platform dashboard
- [ ] AI explanation & next‑problem recommendation
- [ ] Gamification (streaks, goals, shareable cards)

---

## ⚖️ Ethics & limitations

- CodeVault accesses **only your own data**, with your explicit authorization.
- **Source code is private on every platform** — it can never be fetched from a username alone; Path B (one‑time connect) is the only honest way to get it.
- Session tokens **expire** periodically; the app detects this and prompts a clean re‑connect while the stats dashboard keeps working.
- Uses official **GitHub OAuth / tokens** — never handles raw platform passwords.

---

## 👤 Author

**Gaurav Ganesh Teegulla** — [@Gaurav06120714](https://github.com/Gaurav06120714)

<div align="center">

⭐ If you find CodeVault useful, consider starring the repo!

</div>
