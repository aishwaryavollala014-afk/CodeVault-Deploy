# Implementation Plan: Public Portfolio Page

## Objective
Create a shareable public portfolio page so users can share their competitive programming stats with others (recruiters, friends, etc.) via a unique link (e.g., `codevault.io/u/gaurav06`).

## 1. Database & Schema Updates
- **Privacy Setting:** Add a `isPublic` boolean to the `User` model in `schema.prisma` (default: `true`).
- **Unique Handle:** The `User` model already has a `handle` field, which we will use for the URL routing.

## 2. Backend (Express) Updates
- **New Public Routes:** Create `src/routes/public.routes.ts` (if not exists or expand it).
- **Endpoint:** `GET /api/public/u/:handle`
  - Look up the user by `handle`.
  - If `isPublic` is false, return 403 Forbidden.
  - Fetch all connected platforms for this user.
  - Fetch and aggregate stats (using the same logic as the private dashboard, but omitting sensitive info like email).
- **Caching:** Cache the public profile stats in Redis to handle high traffic from shared links.

## 3. Frontend (Next.js) Updates
- **New Route:** Create `src/app/(public)/u/[handle]/page.tsx`.
  - This page will be server-side rendered (SSR) or use React Server Components to fetch data directly for SEO purposes (so link previews on Discord/Twitter look great with OpenGraph tags).
- **UI Design:**
  - Clean, premium read-only version of the dashboard.
  - Big display of aggregate stats, platform breakdowns, and the combined heatmap.
  - "Built with CodeVault" watermark/CTA at the bottom to drive virality.
- **Settings Page:** Update the settings UI to let users change their `handle` and toggle their profile visibility (`isPublic`).

## 4. Open Questions for Review
- Do we want to allow users to hide specific platforms from their public profile, or is it an all-or-nothing "public/private" switch?
- Should the public profile show the user's recent submissions log, or just the high-level aggregated stats and heatmap?
