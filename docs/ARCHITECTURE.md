# CodeVault — Architecture

CodeVault is built around one core insight: **public statistics and private source code are two different kinds of data**, and they must be handled by two independent paths.

## The two data paths

### Path A — Statistics (username only)
- **Input:** a public username / profile link.
- **Source:** public profile endpoints (LeetCode unofficial GraphQL, Codeforces official API, etc.).
- **Output:** solved counts, difficulty/topic breakdown, rankings, streaks, heatmap.
- **Auth:** none. Always available, fully legal.

### Path B — Code synchronization (one-time authorized connect)
- **Input:** an authorized session the user grants once per platform.
- **Source:** the user's *own* accepted submissions, including source code.
- **Output:** organized solution files + an auto-generated README index, pushed to GitHub.
- **Auth:** required. The session is provided a single time; syncing is automatic thereafter.

> A username alone can **never** retrieve source code — it is private on every platform. Path B exists precisely to solve this, with the user's explicit consent, accessing only their own data.

## Flow

```
Public username ───▶ Stats Poller ─────────▶ Unified Dashboard
One-time connect ──▶ Submission Fetcher ──▶ Organizer ──▶ GitHub API ──▶ Public Repo + README
```

## Components

| Module | Responsibility |
|--------|----------------|
| `src/lib/platforms/leetcode.ts` | LeetCode stats (public) + authorized submission fetch |
| `src/lib/platforms/codeforces.ts` | Codeforces stats via official API |
| `src/lib/github/sync.ts` | Organize solutions, push via GitHub API, build README index |
| `src/app/api/sync/route.ts` | Trigger a sync run (manual + scheduled) |
| `prisma/schema.prisma` | Users, connections, synced problems |

## Resilience

- Session tokens expire; CodeVault detects this and shows a **Reconnect** prompt.
- The stats dashboard (Path A) keeps working even when a session (Path B) expires, so the product degrades gracefully instead of breaking.

## Build order (MVP)

1. LeetCode stats (Path A) → dashboard.
2. Codeforces stats (official API).
3. LeetCode code sync (Path B) → GitHub push + README.
4. Multi-platform aggregation.
5. AI explanation & recommendations.
