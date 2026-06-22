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

**CodeVault fixes that.** It:

- Pulls your **public stats** from every platform into a single dashboard.
- Automatically copies your **accepted solutions** into a well‑organized GitHub repo with an auto‑generated index, so anyone (a recruiter, a friend, or future‑you) can search a problem and instantly see how you solved it.

> 📌 This repository is a **monorepo skeleton** — the full folder structure with an empty file for every planned module. Code is added module‑by‑module. The READMEs are the single source of truth for the architecture.

---

## 🗂 Monorepo layout

CodeVault is split into two independent applications:

```
CodeVault/
├── README.md          # ← you are here (project overview)
├── .gitignore
│
├── docs/
│   └── ARCHITECTURE.md   # shared architecture deep-dive
│
├── frontend/          # 🎨 Next.js dashboard UI  →  see frontend/README.md
│   └── src/ ...
│
└── backend/           # ⚙️ Express + TypeScript API & sync engine  →  see backend/README.md
    └── src/ ...
```

| App | Stack | What it does | Docs |
|-----|-------|--------------|------|
| **frontend/** | Next.js 15 · React 18 · Tailwind | Dashboard UI; connect platforms, view stats | [frontend/README.md](frontend/README.md) |
| **backend/** | Node.js · Express · Prisma | Fetches stats & code, runs scheduled syncs, pushes to GitHub | [backend/README.md](backend/README.md) |

> The frontend is a **pure presentation layer** that talks to the backend over REST. The backend owns the database and all external integrations. This separation keeps each side simple and independently deployable.

---

## ✨ Core features

- 📊 **Unified stats dashboard** — total solved, difficulty & topic breakdown, streaks, rankings, heatmap.
- 🔄 **Auto‑sync to GitHub** — solutions organized into folders + a README index (problem no, title, type, difficulty, language, date, link).
- 🔐 **Connect once, automate forever** — authorize a platform a single time; syncing then runs on a schedule.
- 🤖 **(Planned) AI layer** — auto‑explain solutions, auto‑tag problem type, recommend the next problem by your weakest topic.

---

## 🧠 How it works — the two data paths

CodeVault is built on one key insight: **public stats and private source code are two different kinds of data**, so they travel two independent paths. If one breaks, the other still works.

### Path A — Statistics *(username only)*
- **Input:** a public username / profile link.
- **Source:** public endpoints (LeetCode GraphQL, Codeforces official API…).
- **Auth:** none. Always available, fully legal.

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

| Side | Technology | Version |
|------|-----------|---------|
| Frontend | **Next.js** (App Router) | `15.x` |
| Frontend | **React** | `18.3.x` |
| Frontend | **Tailwind CSS** | `3.4.x` |
| Backend | **Express** | `4.19.x` |
| Backend | **Prisma** | `5.18.x` |
| Backend | **node-cron / Zod / axios / pino** | latest |
| Shared | **TypeScript** | `5.5.x` |
| Shared | **Node.js** | `≥ 18.18` |
| Database | **SQLite** (dev) → **PostgreSQL** (prod) | — |

> Per‑app details live in [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md).

---

## 📐 Project rules & conventions

1. **Clear separation** — UI in `frontend/`, all logic & data in `backend/`. The frontend only calls the backend API.
2. **Each app is self‑contained** — its own `package.json`, config, and README.
3. **Two data paths stay separate** — public stats (Path A) never depend on an authorized session (Path B).
4. **Secrets only in `.env`** — never commit real tokens; each app has its own `.env.example`.
5. **Consent first** — the app only ever accesses the user's *own* data, with explicit authorization.
6. **Commit style:** small, focused commits with prefixes — `feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`.
7. **Author attribution:** every commit is authored solely by the project owner — **no co‑authors**.

---

## 🚀 Getting started

```bash
# Backend (API)
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev          # http://localhost:4000

# Frontend (UI) — in a second terminal
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev          # http://localhost:3000
```

---

## 🗺 Roadmap

- [x] Monorepo skeleton (frontend + backend) & architecture
- [ ] Backend: LeetCode stats (Path A)
- [ ] Backend: Codeforces stats (official API)
- [ ] Backend: LeetCode code sync (Path B) → GitHub push + README index
- [ ] Frontend: dashboard + connect flow
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
