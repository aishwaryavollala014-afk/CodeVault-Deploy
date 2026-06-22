# 🗄️ CodeVault

> **Your coding journey, unified and automated.**
> CodeVault aggregates your stats across every competitive-programming platform into one dashboard, and automatically publishes your accepted solutions to a clean, searchable GitHub repository — no browser extension, no per-problem pasting.

---

## ✨ What it does

- 📊 **Unified stats dashboard** — combine LeetCode, Codeforces, CodeChef, HackerRank stats in one place (solved counts, difficulty/topic breakdown, streaks, rankings, heatmap).
- 🔄 **Auto-sync solutions to GitHub** — when you solve a problem, your code lands in an organized repo with an auto-generated README (problem no, title, type, difficulty, language, date, link).
- 🔐 **Connect once, automate forever** — authorize a platform a single time; syncing runs on a schedule with zero manual effort.
- 🤖 **(Planned) AI layer** — auto-explain solutions, auto-tag problem type, recommend the next problem by weak topic.

---

## 🧠 How it works (the honest architecture)

CodeVault separates two independent data paths so one never breaks the other:

| Path | Data | Method | Auth needed |
|------|------|--------|-------------|
| **A — Stats** | Public profile stats | Username / profile link | None |
| **B — Code sync** | Your own solution source code | One-time authorized session | Connect once |

> ⚠️ **Important reality:** A username alone can fetch *stats* but **never your source code** — submitted code is private on every platform. CodeVault gets your code only through a **one-time authorized connection** to *your own* account, then automates the rest.

```
Public username ───▶ Stats Poller ─────────▶ Unified Dashboard
One-time connect ──▶ Submission Fetcher ──▶ Organizer ──▶ GitHub API ──▶ Public Repo + README
```

---

## 📁 Project structure

```
CodeVault/
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── prisma/
│   └── schema.prisma          # users, connected platforms, synced problems
├── docs/
│   └── ARCHITECTURE.md        # deep-dive on the two data paths
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx           # dashboard
    │   ├── globals.css
    │   └── api/
    │       └── sync/route.ts  # triggers a sync run
    └── lib/
        ├── db.ts             # database client
        ├── platforms/
        │   ├── leetcode.ts   # stats + (authorized) submission fetch
        │   └── codeforces.ts # public API stats
        └── github/
            └── sync.ts       # organizes solutions + pushes via GitHub API
```

---

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then fill in DATABASE_URL and GITHUB_TOKEN

# 3. Set up the database
npx prisma db push

# 4. Run the dev server
npm run dev
```

Open http://localhost:3000 to view the dashboard.

---

## 🛠️ Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for the dashboard UI
- **Prisma** + database for users / connections / synced problems
- **GitHub API** (via OAuth token) for pushing solutions
- Scheduled sync job for automatic updates

---

## 🗺️ Roadmap

- [x] Project scaffold & architecture
- [ ] LeetCode stats (public)
- [ ] LeetCode code sync (one-time connect)
- [ ] Codeforces stats (official API)
- [ ] GitHub auto-push + README generator
- [ ] Unified multi-platform dashboard
- [ ] AI explanation & next-problem recommendation
- [ ] Gamification (streaks, goals, shareable cards)

---

## ⚖️ Ethics & limitations

- CodeVault only ever accesses **your own** data, with your explicit authorization.
- Session tokens expire periodically; the app detects this and prompts a clean re-connect while the stats dashboard keeps working.
- Uses official GitHub OAuth — never handles raw passwords.

---

## 👤 Author

**Gaurav Ganesh Teegulla** — [@Gaurav06120714](https://github.com/Gaurav06120714)
