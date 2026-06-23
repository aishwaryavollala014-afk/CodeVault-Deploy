<div align="center">

# 🎨 CodeVault — Frontend

### The dashboard UI for CodeVault.

A **Next.js (App Router) + TypeScript + Tailwind CSS** application that lets users connect their coding platforms, view unified stats, and manage GitHub sync. It talks to the [backend](../backend) over a REST API.

</div>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Design principles](#-design-principles)
3. [Tech stack & versions](#-tech-stack--versions)
4. [Folder structure](#-folder-structure)
5. [Layer‑by‑layer guide](#-layer-by-layer-guide)
6. [File‑by‑file guide](#-file-by-file-guide)
7. [Data flow](#-data-flow)
8. [Frontend rules & conventions](#-frontend-rules--conventions)
9. [Getting started](#-getting-started)

---

## 🧩 Overview

The frontend is a **pure presentation layer** — it renders UI and calls the backend API. It never talks to the database or external platforms directly; all of that lives in the backend. This keeps the UI fast, simple, and easy to test.

Main screens:
- **Landing** (`/`) — intro + call to action.
- **Login** (`/login`) — GitHub sign‑in.
- **Connect** (`/connect`) — add a platform username / authorize sync.
- **Dashboard** (`/dashboard`) — your private unified analytics across all platforms.
- **Public profile** (`/u/[username]`) — a shareable public page showing a user's *total* analysis, built from public stats only (no auth needed).

### 📊 What the dashboard shows

A single, unified analytics view combining every connected platform:

- **Totals** — problems solved across all platforms, plus per‑platform counts.
- **Difficulty breakdown** — Easy / Medium / Hard split (chart).
- **Topic strengths & weaknesses** — solved count per topic/tag.
- **Language usage** — which languages you solve in.
- **Activity heatmap** — calendar of solve activity / streaks.
- **Rankings & ratings** — current rank/rating per platform (e.g. Codeforces).
- **Sync status** — how many problems are pushed to GitHub, and any platform needing reconnect.

---

## 🎯 Design principles

- **Feature‑first** — code is grouped by feature (`features/stats`, `features/platforms`), not by file type only.
- **Dumb components, smart hooks** — UI components are presentational; data fetching lives in hooks.
- **One API client** — all network calls go through `lib/api-client.ts`.
- **Reusable UI kit** — shared primitives (`Button`, `Card`, `Badge`) under `components/ui`.

---

## 🛠 Tech stack & versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **Next.js** (App Router) | `15.x` |
| Language | **TypeScript** | `5.5.x` |
| UI library | **React** | `18.3.x` |
| Styling | **Tailwind CSS** | `3.4.x` |
| CSS pipeline | **PostCSS** + autoprefixer | `8.4.x` |
| Runtime | **Node.js** | `≥ 18.18` |

---

## 📁 Folder structure

```
frontend/
├── package.json                # dependencies, scripts, metadata
├── tsconfig.json               # TypeScript config + @/* alias
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind theme & content paths
├── postcss.config.mjs          # PostCSS pipeline
├── .env.example                # required public env vars (API base URL…)
├── .gitignore
│
├── public/                     # static assets (icons, images)
│   └── .gitkeep
│
└── src/
    ├── app/                    # Next.js App Router (routes)
    │   ├── layout.tsx          # root layout (html shell, metadata)
    │   ├── page.tsx            # landing page (/)
    │   ├── globals.css         # global styles + Tailwind directives
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx     # /login
    │   ├── connect/
    │   │   └── page.tsx         # /connect
    │   └── dashboard/
    │       └── page.tsx         # /dashboard
    │
    ├── components/             # reusable React components
    │   ├── ui/                 # design-system primitives
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   └── Badge.tsx
    │   ├── dashboard/          # dashboard-specific widgets
    │   │   ├── StatCard.tsx
    │   │   ├── StatsGrid.tsx
    │   │   ├── PlatformList.tsx
    │   │   └── ActivityHeatmap.tsx
    │   └── layout/             # page chrome
    │       ├── Navbar.tsx
    │       └── Footer.tsx
    │
    ├── features/              # feature modules (api + types per feature)
    │   ├── stats/
    │   │   ├── api.ts          # calls backend /api/stats
    │   │   └── types.ts        # Stats DTOs
    │   └── platforms/
    │       ├── api.ts          # calls backend /api/platforms
    │       └── types.ts        # Platform/Connection DTOs
    │
    ├── hooks/                 # React data-fetching hooks
    │   ├── useStats.ts
    │   └── usePlatforms.ts
    │
    ├── lib/                   # shared client utilities
    │   ├── api-client.ts       # configured fetch/axios wrapper
    │   └── utils.ts            # small helpers (formatting, classnames)
    │
    ├── types/                 # shared TypeScript types
    │   └── index.ts
    │
    ├── constants/             # static config
    │   └── platforms.ts        # platform metadata (names, icons, colors)
    │
    └── styles/                # design tokens
        └── theme.ts            # colors, spacing tokens used in TS
```

---

## 🧱 Layer‑by‑layer guide

| Layer | Folder | Responsibility | Rule |
|-------|--------|----------------|------|
| **Routes** | `app/` | Define pages & layouts | Keep pages thin; compose components |
| **UI kit** | `components/ui/` | Generic, reusable primitives | No business logic, no data fetching |
| **Widgets** | `components/dashboard/`, `components/layout/` | Feature/page-specific UI | Receive data via props |
| **Features** | `features/` | API calls + types per domain | One folder per feature |
| **Hooks** | `hooks/` | Fetch & cache data for components | The bridge between UI and `features/*/api` |
| **Lib** | `lib/` | API client & helpers | All network calls go through `api-client` |
| **Types / Constants / Styles** | respective | Shared building blocks | Pure & dependency-light |

---

## 📄 File‑by‑file guide

### Root config
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `start`, `lint`), metadata. |
| `tsconfig.json` | TypeScript options + `@/*` alias to `src/`. |
| `next.config.mjs` | Next.js settings. |
| `tailwind.config.ts` | Theme tokens & which files Tailwind scans. |
| `postcss.config.mjs` | Runs Tailwind + autoprefixer. |
| `.env.example` | Public env vars (e.g. `NEXT_PUBLIC_API_URL`). |
| `.gitignore` | Frontend-specific ignores. |

### Routes (`src/app`)
| File | Route | Purpose |
|------|-------|---------|
| `layout.tsx` | — | Root HTML shell, metadata, global CSS. |
| `page.tsx` | `/` | Landing page. |
| `globals.css` | — | Global styles + Tailwind directives. |
| `(auth)/login/page.tsx` | `/login` | GitHub sign-in. |
| `connect/page.tsx` | `/connect` | Connect a platform. |
| `dashboard/page.tsx` | `/dashboard` | Private unified stats dashboard. |
| `u/[username]/page.tsx` | `/u/:username` | Public shareable analysis profile (stats only). |

### Components
| File | Purpose |
|------|---------|
| `ui/Button.tsx` | Reusable button primitive. |
| `ui/Card.tsx` | Reusable card container. |
| `ui/Badge.tsx` | Small status/difficulty badge. |
| `dashboard/StatCard.tsx` | Single stat tile (label + value). |
| `dashboard/StatsGrid.tsx` | Grid of stat cards. |
| `dashboard/PlatformList.tsx` | List of connected platforms. |
| `dashboard/ActivityHeatmap.tsx` | Solve-activity heatmap. |
| `layout/Navbar.tsx` | Top navigation bar. |
| `layout/Footer.tsx` | Page footer. |
| `profile/ProfileHeader.tsx` | Public profile header: avatar, name, handles, headline totals. |
| `profile/AnalysisSection.tsx` | Public profile body: the full analysis (difficulty, topics, languages, heatmap). |

### Features / Hooks / Lib / Types / Constants / Styles
| File | Purpose |
|------|---------|
| `features/stats/api.ts` | Fetch aggregated stats from the backend. |
| `features/stats/types.ts` | TypeScript shapes for stats. |
| `features/platforms/api.ts` | Connect/list platform calls. |
| `features/platforms/types.ts` | TypeScript shapes for platforms. |
| `features/profile/api.ts` | Fetch a user's public total analysis by username (no auth). |
| `features/profile/types.ts` | TypeScript shapes for the public profile. |
| `hooks/useStats.ts` | Hook to load & cache dashboard stats. |
| `hooks/usePlatforms.ts` | Hook to load & manage connections. |
| `lib/api-client.ts` | Single configured HTTP client (base URL, auth header). |
| `lib/utils.ts` | Small helpers (date/number formatting, classnames). |
| `types/index.ts` | Shared type barrel. |
| `constants/platforms.ts` | Platform metadata (name, icon, brand color). |
| `styles/theme.ts` | Design tokens usable from TypeScript. |

---

## 🔄 Data flow

```
Component  ──uses──▶  Hook (useStats)  ──calls──▶  features/stats/api.ts
                                                        │
                                                        ▼
                                                 lib/api-client.ts
                                                        │
                                                        ▼
                                            Backend  GET /api/stats
```

The UI never calls the backend directly — it goes through a hook → feature API → shared client. This makes data fetching consistent and easy to mock in tests.

---

## 📐 Frontend rules & conventions

1. **Pages stay thin** — route files compose components; they don't hold heavy logic.
2. **No direct fetch in components** — always go through a hook → `features/*/api` → `lib/api-client`.
3. **UI primitives are presentational** — `components/ui/*` never fetch data or hold business logic.
4. **Feature-first grouping** — new domains get a folder under `features/`.
5. **Imports use the `@/` alias** — e.g. `import { Button } from "@/components/ui/Button"`.
6. **Only `NEXT_PUBLIC_*` env vars** are exposed to the browser; secrets stay in the backend.
7. **Commits:** small and prefixed (`feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`); authored solely by the project owner — no co‑authors.

---

## 🚀 Getting started

> The frontend is currently a skeleton (empty files showing the structure). Once implemented:

```bash
cd frontend

# 1. Install
npm install

# 2. Configure
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL=http://localhost:4000

# 3. Run
npm run dev                    # open http://localhost:3000
```
