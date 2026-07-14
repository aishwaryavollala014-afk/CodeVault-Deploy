# CodeVault — working notes for Codex

## Codebase navigation — prefer the graph over reading files
This repo is indexed by the **`codebase-memory`** MCP server (config in `.mcp.json`). For
exploration, mapping, and "where is X / what calls Y" questions, **use the graph tools first
— they use far fewer tokens than reading files one by one:**
- `get_architecture` — overview: languages, routes, clusters, node/edge counts
- `search_graph` / `search_code` — find symbols/files by name or pattern
- `trace_path` — follow function call chains
- `get_code_snippet` — read a specific symbol by qualified name (instead of opening the file)
- `detect_changes` — map a git diff to affected symbols
Only fall back to `Read`/`Grep` when the graph lacks the detail you need, or after edits that
aren't indexed yet. Re-index after large changes:
`codebase-memory-mcp cli index_repository --repo-path . --name codevault --mode moderate`
(The local index at `.codebase-memory/` is gitignored; each dev re-indexes — it's near-instant.)

## Source of truth for status
- `docs/PROGRESS.md` and `docs/FEATURES.md` are the **reconciled, code-verified** status. Trust
  these over the static plan docs.

## Run it (dev)
- Infra: `colima start && docker compose up -d postgres redis` (Postgres **:5433**, Redis **:6380**)
- `web-backend` **:4000** · `git-service` **:5050** (not 5000) · `web-frontend` **:3000**
- Each backend has its **own Prisma schema** (`web-backend/prisma` + `git-service/prisma`) — change both.
- DB migrations have a known rogue duplicate (`20260705084349_init`); use `npx prisma db push` locally until it's cleaned up.

## Conventions
- One file = one commit, push after each; conventional prefixes (`feat:`/`fix:`/`docs:`/`chore:`).
- Author is the project owner only — **never** add a Codex co-author. Use `/usr/bin/git`.
- Pull `--rebase` before push (single shared `main`, two devs).
- Team split: **Gaurav** → git-service, browser-extension, sync/repos frontend · **Aishwarya** → web-backend, stats/profile frontend.
