# 🧩 CodeVault — Browser Extension Plan

> The cross-browser extension is **Path B v2 (capture-at-source)**. This document is the planning blueprint — no code. Read with [README.md](../README.md), [browser-extension/README.md](../browser-extension/README.md), [API_CONTRACT.md](API_CONTRACT.md), [AUTH_SECURITY.md](AUTH_SECURITY.md), [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md), and [PLATFORM_INTEGRATION.md](PLATFORM_INTEGRATION.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 0. Why this reverses a founding constraint (on purpose)

`context.md` and `README.md` originally listed **"❌ No browser extension"** as a hard constraint; the two-path architecture avoided one by replaying a one-time platform **session token** server-side (Path B).

That server-side replay is the weakest part of the design — tokens expire silently, break on platform UI/API changes, and brush against scraping ToS (Path B was never live-tested for exactly this reason). The extension fixes it: because the user is **already authenticated in their own browser** when they solve a problem, the extension reads *their own* accepted code from the page and pushes it. No stored platform passwords, no server-side session replay.

**Framing:** the extension is not a fourth pillar — it is a cleaner **ingestion source for Path B**. Path A (public stats by username) is untouched.

---

## 1. Scope

**In scope**
- Detect an **Accepted** submission on LeetCode, Codeforces, CodeChef, HackerRank.
- Capture problem metadata + the user's source code from the page.
- Sign in as the **same CodeVault user** (GitHub identity) and push captures to **git-service**, reusing its existing GitHub pipeline.
- Ship to Chrome, Edge, Brave, Opera, Arc, Firefox, and (later) Safari.

**Out of scope**
- Path A stats (still username-only, no extension).
- Any change to git-service's GitHub push / README-index logic (reused as-is).
- Storing platform passwords or replaying platform sessions server-side.
- **A dedicated extension backend.** There is **none** — see the constraint below.

> 🚫 **No separate backend (hard constraint).** The extension is a **thin client** with **no backend of its own**. It uses the two existing services only: **web-backend** for auth and **git-service** for code ingest. The endpoints in §5 are *added to* those services — not a new `extension-backend`/`extension-server`. This keeps one identity, one JWT, and one GitHub-push pipeline.

---

## 2. Cross-browser strategy (one codebase)

| Target | How |
|--------|-----|
| Chrome · Edge · Brave · Opera · Arc | **Manifest V3** directly (Chromium) |
| Firefox | Same MV3 source + `browser_specific_settings`; minor background/event differences |
| Safari | `xcrun safari-web-extension-converter` → **App Store** (needs Apple Developer account) |

- One source against the **WebExtensions API** + `webextension-polyfill`.
- Build framework (**WXT** or **CRXJS + Vite**) emits per-target bundles.
- Priority: Chromium + Firefox first (single artifact covers most users); **Safari is a later milestone**.

---

## 3. Login — "same user" (the core requirement)

The extension authenticates as the **same GitHub-identity user** as the website — one `users` row, no separate account or auth system.

**Flow (OAuth handoff, PKCE-style):**
1. User clicks **Sign in** in the popup.
2. Extension opens web-backend `/api/auth/extension/start?challenge=…` via `launchWebAuthFlow`.
3. User completes the **normal GitHub OAuth** (same user, same `users` row).
4. Backend returns a one-time **authorization code** to the extension's redirect.
5. Extension exchanges it at `/api/auth/extension/token` for a **JWT access token + rotating refresh token** (same shape the services already issue).
6. Tokens stored in `chrome.storage.local`; rotated; **revocable** from Settings.

**Reuses existing assets (low effort):**
- web-backend **refresh rotation + reuse-detection** — just tag the session `client = extension`.
- git-service **same-JWT verify (S1)** — the extension calls git-service with a JWT it already validates.

**Why not share the website cookie:** extensions run in a separate context; the website's httpOnly cookie is (and should stay) unreadable to extension JS. A dedicated, independently-revocable extension token is cleaner.

---

## 4. Capture mechanism

A **content script** per platform + a **background service worker**:

1. Content script watches for an accepted verdict — preferably by **intercepting the platform's own network response** (e.g. LeetCode's submission-check GraphQL/REST), with DOM scraping as fallback.
2. On `status === Accepted`, extract: problem number, slug, title, difficulty, tags, language, and the **submitted code** (Monaco editor / submission detail).
3. Post a normalized payload to the background worker.
4. Background worker calls **git-service `POST /api/ingest`** with the JWT.

| Platform | Primary capture signal | Code source |
|----------|------------------------|-------------|
| LeetCode | submission-check GraphQL/REST response | Monaco editor / submission detail |
| Codeforces | verdict poll → "Accepted" | user's own submission page |
| CodeChef | submission status DOM/network | submission view |
| HackerRank | submission result DOM/network | submission view |

Build **LeetCode end-to-end first**, then fan out.

---

## 5. Backend changes (small, additive)

**web-backend (auth surface only)**
- `POST /api/auth/extension/start` — wrap existing GitHub OAuth with `client=extension` + PKCE challenge
- `POST /api/auth/extension/token` — exchange code → JWT pair
- `POST /api/auth/extension/refresh` — rotate (reuse existing rotation)
- `GET /api/auth/extension/sessions` · `DELETE /…/:id` — list / revoke from Settings

**git-service (one new endpoint)**
- `POST /api/ingest` — accept captured submission(s); **reuse** existing JWT verify, repo-ownership check, dedupe vs `problems`, then run the existing push + README regen.

**DB**
- Add a `client` discriminator (`web` \| `extension`) to the existing `auth_sessions` table.
- Optional `ingest_log` (idempotency key) so a re-submitted problem is not double-pushed.

> Net: ~6 small endpoints, 1 column, **0 changes** to the GitHub-push core.

---

## 6. Permissions & manifest (least-privilege)

- `host_permissions`: only the four platform domains **+** the CodeVault API domain (never `<all_urls>`).
- `permissions`: `storage`, `scripting`, `identity`.
- Strict `content_security_policy`; **no remote code**.
- MV3 background **service worker**.

---

## 7. Security model

- Treat extension input as **untrusted** server-side: Zod-validate the ingest payload, enforce ownership, rate-limit, cap code size.
- Tokens in `chrome.storage.local` (not `localStorage`); rotated; per-session revoke.
- Validate all content-script ↔ background messages (origin + shape).
- **Consent:** the user is signed into the platform as themselves; we capture only *their own accepted code* — same own-data-only model already documented. Full detail in [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md).

---

## 8. UX

- **Popup:** sign-in status (same GitHub user), per-platform auto-capture toggles, recent captures, "Sync now," link to dashboard.
- **Options:** account, capture preferences, target repo, revoke sessions.
- **Onboarding:** install → sign in (same user) → grant host permissions → solve a problem → watch it land in the repo + dashboard.

---

## 9. Risk register

| Risk | Mitigation |
|------|-----------|
| Platform DOM/API changes break capture | Prefer network interception over DOM; resilient selectors; fast patch path |
| Safari store friction | Defer to a later milestone; Chromium + Firefox first |
| Token theft from extension storage | Short-lived access + rotated refresh + reuse detection + per-session revoke |
| ToS / consent | Own-data-only, client-side, explicit consent; privacy doc |
| Double-pushing a problem | Idempotency key + dedupe vs `problems` table |
| Overlap with old session-token Path B | Make the extension the **primary** Path B; deprecate/park session replay |

---

## 10. Milestones

| Milestone | Goal |
|-----------|------|
| **E0 — Auth** | Scaffold extension; sign in as same user; token exchange/refresh; `GET /me` works |
| **E1 — LeetCode E2E** | Capture → `POST /api/ingest` → GitHub push (proves the full loop) |
| **E2 — More platforms** | Codeforces, then CodeChef + HackerRank |
| **E3 — Cross-browser** | Firefox build, then Safari conversion |
| **E4 — UX & control** | Popup, options, session revocation in Settings |
| **E5 — Hardening + stores** | Chrome Web Store, Firefox AMO, Edge Add-ons, App Store |

---

## 11. Decision to confirm

The extension and the original server-side Path B (session-token replay) now overlap. **Recommendation:** make the extension the **primary Path B** and deprecate/park the session-token fetcher — maintaining both doubles the platform-integration surface for the same result.


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
