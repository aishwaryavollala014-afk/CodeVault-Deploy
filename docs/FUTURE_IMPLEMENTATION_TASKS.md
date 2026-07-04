# CodeVault: Future Implementation Tasks

This document outlines the detailed technical roadmap for the future development of CodeVault. Following this roadmap will transition the project from a working prototype into a robust, scalable, and secure production application.

> ⚠️ **Reconciled with the codebase (`[x]` = already built).** This doc was written from the frontend/web-backend vantage; several "future" items — the **browser extension**, the **BullMQ queue engine**, and the **cron scheduler** — are **already implemented** in `git-service/` and `browser-extension/` (Gaurav). See [PROGRESS.md](PROGRESS.md) and [FEATURES.md](FEATURES.md) for the reconciled truth. Boxes below are ticked to match what actually exists.

## Phase 1: The Browser Extension (Top Priority)
**Goal:** Establish a secure, zero-friction method to extract accepted code submissions from platforms without requiring users to hand over their highly sensitive session cookies.

**Tasks:**
- [x] Initialize a new `browser-extension` workspace (CRXJS + Vite, Chrome Manifest V3). *Built.*
- [x] **Content Scripts:** platform-specific content scripts for LeetCode, Codeforces, CodeChef, and HackerRank. *Built — selectors still need live testing.*
- [x] **Submission Interception:** detect the "Accepted" verdict. *Built.*
- [x] **Code Extraction:** capture source code, problem title, and language. *Built.*
- [x] **Backend Sync:** authenticate with JWT and `POST /api/ingest` to git-service. *Built.*
- [ ] **Build-verify** (`npm run build`) + live end-to-end test on each platform. *Pending (G).*

## Phase 2: The `git-service` Queue Engine
**Goal:** Safely synchronize thousands of code files to GitHub without triggering abuse rate limits.

**Tasks:**
- [x] Set up a message queue system (Redis + BullMQ). *Built (`git-service/jobs/queue.ts`).*
- [x] Create the `git-service` worker application. *Built.*
- [x] Enqueue a "sync task" rather than pushing immediately. *Built (`sync.job.ts`).*
- [~] Configure a safe processing rate to avoid GitHub limits. *Queue in place; verify rate-limit tuning.*
- [x] Handle GitHub API failures, retries, and token/session expiration. *Built (`ExpiredSessionError`, retries).*

## Phase 3: Public Portfolios (`/u/[username]`)
**Goal:** Create the viral growth engine for CodeVault by allowing users to share their aggregated stats with the world.

**Tasks:**
- [x] Build the public routing in Next.js (`app/u/[username]/page.tsx`). *Page exists.*
- [x] Backend API `GET /api/public/:handle` (no auth). *Built (A).*
- [~] Wire the public page to the API — currently renders **static mock**, not the live endpoint. *Pending (A).*
- [ ] OpenGraph / SEO preview cards for shared links. *Pending (A).*

## Phase 4: Automated Cron Jobs & Notifications
**Goal:** Keep user data fresh and inform them of sync statuses.

**Tasks:**
- [x] Implement a cron scheduler (node-cron). *Built (`git-service/jobs/scheduler.ts`).*
- [~] Daily job to refresh public stats for all active users. *Scheduler runs auto-sync; a dedicated stats-refresh job may still be needed.*
- [ ] Build the Notifications panel UI. *Pending (A).*
- [~] Notifications on sync/token failure. *Service emits them; API route is **not mounted** yet — wire `notification.routes` in web-backend. (A)*
