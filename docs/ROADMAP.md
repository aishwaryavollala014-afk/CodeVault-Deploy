# 🗺️ CodeVault — Consolidated Project Roadmap

> Technical Program Manager + Principal Architect view. **One unified roadmap** covering all disciplines: FE, BE, DB, security, DevOps, infra, testing, integrations, deployment. Companion to all docs in `docs/`. No code.

> 📊 **Live status lives in [FEATURES.md](FEATURES.md)**, not here. This roadmap is the *plan*; FEATURES.md is *what's actually built* (derived from the code). Snapshot: **M0–M1 done** (auth, connections, JWT contract, GitHub OAuth working); **M2/M4 partial** (LeetCode stats + LeetCode Path B sync live; dashboard/profile still on mock data; `/repos` + notifications routes unmounted). See FEATURES.md → *Known gaps* for the exact open items.

---

## 0. Summary

**Product:** CodeVault — competitive programming analytics + GitHub sync platform.  
**Team:** 2 developers (FE lead + BE lead) working in parallel.  
**Services:** web-frontend (Next.js) + web-backend (Express) + git-service (Express + workers).  
**Total milestones:** 7 (M0 → M6), from empty repo to production launch, **+ M7 (browser extension, Path B v2)** as a parallel track gated on M1.  
**Critical path:** JWT contract → Auth → Connections → Stats → Sync → All 15 pages live → Hardening → Deploy.

---

## 1. Parallel Development Overview

```
Week  1   2   3   4   5   6   7   8   9  10  11  12  13  14
      ├───────M0──┤
      ·      ├───────────M1 Auth──────────────┤
      ·      ├──M1-FE: Shell+Marketing────────┤
      ·                ├───────M2 Stats+Dash──────────────┤
      ·                ├───M2-FE: Dashboard wiring─────────┤
      ·                         ├──M3 Public+Settings──────────┤
      ·                                   ├──M4 Sync+Repos──────────────┤
      ·                                              ├──M5 Complete─────────┤
      ·                                                        ├───M6 Harden+Deploy────┤

Legend: BE=backend tasks · FE=frontend tasks · ·=parallel work ongoing
```

**Parallel from day 1:**
- FE can build UI kit + layouts + all marketing pages + mocked app pages **without any backend** (MSW mocks from API_CONTRACT).
- BE builds config→auth→connections→stats independently.
- Both block on **JWT contract + AggregatedStats shape** (freeze in M0).

---

## 2. Milestone Definitions

### M0 — Foundations & Contract Freeze
**Objective:** Tooling live, contracts frozen, parallel work can begin.  
**Estimated effort:** 3–4 days.  
**Dependencies:** None.

| Area | Deliverables |
|------|-------------|
| **Infra** | Managed Postgres + Redis provisioned (dev env); CI pipeline scaffolded; secret manager configured |
| **DB** | Baseline migration applied (all tables, enums, indexes from DATABASE_PLAN §4) |
| **BE** | Config/env validation; health + readiness endpoints; error envelope; per-service DB roles; pino logger; `requestId` middleware |
| **FE** | Next.js + TS + Tailwind; design tokens (coral/gold/rose); Inter + JetBrains Mono via next/font; api-client skeleton (2 bases); React Query provider |
| **Security** | Secret scanning + SCA in CI; `.gitignore` enforced; envelope encryption library configured (KMS key provisioned) |
| **Contract** | `API_CONTRACT.md` frozen (JWT claims, AggregatedStats shape, error envelope); shared DTO types published; MSW handlers matching contract |
| **Testing** | Jest/Vitest configured; Testcontainers working; basic test factory files; CI lint+typecheck gate live |

**Completion criteria:** Both services boot; `/health` returns 200; CI passes; JWT claim shape frozen and documented; MSW mocks return contract-shaped responses.  
**Risks:** JWT contract churn after FE work begins → freeze JWT + AggregatedStats before parallel work starts; any change requires PR to `API_CONTRACT.md`.

---

### M1 — Auth & Shells
**Objective:** Real login works; all three layout shells navigable; marketing site live.  
**Estimated effort:** 5–7 days.  
**Dependencies:** M0.

| Area | FE deliverables | BE deliverables |
|------|-----------------|-----------------|
| **Auth** | Login page, GitHub OAuth button, AuthProvider, redirect guard, 401 handler | GitHub OAuth start/callback; JWT issue (access + refresh); refresh rotation + reuse detection; `/auth/session`, `/logout`; CSRF protection; rate-limit on auth |
| **Shells** | PublicLayout (Navbar + Footer), AuthLayout (split), AppLayout (Sidebar + Topbar + MobileDrawer); route groups; `loading.tsx` + `error.tsx` + `not-found.tsx` | `/users/me` |
| **Marketing** | Landing (all 11 sections), Privacy, Terms, Contact — static, fully responsive, a11y verified | None (static) |
| **UI kit** | Button, IconButton, Pill/Badge, PlatformBadge, Switch, SegmentedControl, Input/Select/FormField, CopyButton, Toast, ConfirmDialog, BrandMark | None |
| **Security** | Cookies httpOnly+Secure+SameSite; no token in localStorage | git-service verifies same JWT (shared signing key) |
| **Testing** | UI kit Storybook; login flow E2E (Playwright); component tests for guard | Auth unit + integration; refresh rotation; 401 shape; CSRF rejection |

**Completion criteria:** GitHub OAuth login → `/app/overview` shell works end-to-end; guard rejects unauthenticated; marketing pages match prototype; git-service accepts same JWT.  
**Risks:** GitHub OAuth config per-environment → set up all 5 OAuth apps early; CSRF + SameSite subtle issues → test cross-origin early.

---

### M2 — Connections, Stats, Overview Dashboard
**Objective:** Core product value — dashboard live on real data from connected platform handles.  
**Estimated effort:** 8–10 days.  
**Dependencies:** M1.

| Area | FE deliverables | BE deliverables |
|------|-----------------|-----------------|
| **Connections** | Connect flow (platform picker + username input + mode selector); connections list in Settings Platforms section | `/connections` CRUD; username regex (SSRF); unique constraint; `/connections/:id/authorize` + encrypted token storage |
| **Stats (Path A)** | — | LeetCode stats integration; Codeforces stats; CodeChef stats; HackerRank stats; aggregation service; `/stats`; Redis cache; `stats_snapshots`; `degraded[]` handling |
| **Dashboard** | Overview page: ProfileHeader, StatsGrid, DifficultyRing, ContributionHeatmap, PlatformBreakdown, TopicChips, SkillBadge, SubmissionsTable — all wired to React Query; loading/empty/error states | `/stats/recent` |
| **Data viz** | DifficultyRing, ContributionHeatmap (seeded), PlatformBreakdown — as client islands with dynamic import | Stats aggregation; heatmap calendar data |
| **Testing** | Stats page states (loading/empty/error/partial); Connect flow form validation | Each platform integration unit-tested with mock responses; aggregation correctness; cache TTL; BOLA on connections |

**Completion criteria:** User connects LeetCode handle (stats-only) → dashboard renders real numbers with correct difficulty split and heatmap; `degraded[]` surfaced if upstream fails; zero BOLA (User A cannot see User B's connections).  
**Risks:** LeetCode GraphQL schema changes → adapter isolated; cache-miss storm → Redis TTL + `stats_snapshots` fallback verified; upstream API timeouts → timeout + fallback tested.

---

### M3 — Analytics, Public Profile, Settings
**Objective:** Depth pages + shareable profile + full account management.  
**Estimated effort:** 6–8 days.  
**Dependencies:** M2.

| Area | FE deliverables | BE deliverables |
|------|-----------------|-----------------|
| **Analytics** | Analytics page: SegmentedControl filter, monthly bars, DifficultyRing, language bars, Codeforces sparkline — wired to `/stats?range=&platform=` | `/stats` query params (`range`, `platform`); detailed breakdown in `AggregatedStats` |
| **Public profile** | `/u/[username]` — SSR/ISR with `generateMetadata` for OG tags; no-auth visitor view; Manage Public Profile page with visibility toggles + CopyButton + ProfilePreviewCard | `/public/:username` — public-only fields; **no email/tokens**; Redis cache; uniform 404; rate-limit |
| **Settings** | Settings page: all 8 sections (Account, Platforms, GitHub, Sync, Public Profile, Notifications, Appearance, Danger Zone); optimistic toggles; field validation; ConfirmDialog for destructive actions; toasts | `/settings` GET + PATCH; `/github/repos` GET + PATCH; field allowlist (mass-assignment prevention); audit log on sensitive changes; ConfirmDialog-gated actions validate `{ confirm: true }` |
| **Testing** | Public profile SSR + OG; no-PII assertion; optimistic toggle revert; settings save → toast; ConfirmDialog guard | `/public` enumeration-hardened; field allowlist tested; PATCH rejects `role`/`plan`; public profile no email leak |

**Completion criteria:** Public profile shareable link works for visitors (SSR); settings persist; Danger Zone requires confirm; analytics filters refetch correctly.  
**Risks:** Public profile SEO → verify `generateMetadata` and OG tags; scraping at `/public/:username` → rate-limit + cache verified.

---

### M4 — GitHub Sync (Path B) + Sync Status + Repositories
**Objective:** Solutions land in GitHub; sync status visible; repositories browsable.  
**Estimated effort:** 10–12 days (most complex milestone).  
**Dependencies:** M2 (connections + token storage).

| Area | FE deliverables | BE deliverables (git-service) |
|------|-----------------|-------------------------------|
| **Sync trigger** | "Run sync now" button → POST → 202 toast; SESSION_EXPIRED → Reconnect flow | `/sync` (POST) — ownership check from JWT; enqueue to BullMQ; per-connection lock; cooldown; `SESSION_EXPIRED` error |
| **Sync status** | SyncStatus page: HealthBanner, ConnectionRow with status pills, ActivityLog — poll `/sync/status` while running | `/sync/status`, `/sync/activity`; SyncRun records; activity event log |
| **GitHub publish** | — | GitHub client; folder writer (`<num>/question.md` + `solution.<ext>`); README index generator; batch commit (one commit per sync run); `github_repos` record |
| **Path B fetch** | — | LeetCode submission fetch (authed) + code + question; diff vs `problems` table (idempotent); upsert `problems`; update `connections.solved_count`; token expiry → `SESSION_EXPIRED` |
| **Scheduler** | — | `node-cron` → enqueue per-connection jobs; advisory lock in Redis; concurrency caps; stale job cleanup; retry with exponential backoff |
| **Repositories** | Repositories page: RepoHeader, FileList (paginated), CommitList, RepoMappingRow → configure Settings | `/repos`, `/repos/:platform/files`, `/repos/:platform/commits` — ownership; pagination |
| **Security** | — | Egress allowlist (platform + GitHub only); token decrypted in-memory only; zero token logging; `key_version` rotation-ready |
| **Testing** | SyncStatus states; SESSION_EXPIRED → Reconnect CTA; poll stops when complete; repo pagination | Sync idempotency (re-run = no duplicate); token decrypt; expiry path; GitHub batch commit; lock prevents parallel; BOLA on sync trigger |

**Completion criteria:** New accepted LeetCode problem → appears in GitHub repo in correct folder within one scheduled cycle; re-running sync = no duplicates; expired session surfaces Reconnect; repositories page browses real files.  
**Risks:** LeetCode session token expiry common → expiry flow robustly tested; non-idempotent push → idempotency verified with integration tests; GitHub API rate limit during bulk sync → batch commits + rate-limit headroom verified.

---

### M5 — Problem Detail, Notifications, Remaining Pages
**Objective:** Every one of the 15 prototype pages live on real data.  
**Estimated effort:** 5–6 days.  
**Dependencies:** M4.

| Area | FE deliverables | BE deliverables |
|------|-----------------|-----------------|
| **Problem detail** | `/p/[platform]/[number]` — QuestionPanel (sanitized markdown), CodeBlock (syntax-highlighted, text not executed), breadcrumb, GitHub + platform links | `/problems/:platform/:number` — ownership; sanitized `questionMarkdown`; `solutionPath`; `githubUrl` |
| **Notifications** | Notifications page — ActivityLog rows; "Mark all as read" → optimistic; bell count in Topbar | `/notifications` GET (paginated); `/notifications/read` POST; unread count via partial index; emit notification on sync events / expiry |
| **Codeforces + CC + HR sync (Path B)** | — | Adapters for CF (API-key based), CC, HR (session-based); register in adapter registry; per-adapter tests |
| **Remaining path A coverage** | Analytics chart accuracy verified against all 4 platforms | Verify aggregation handles missing/partial platform data gracefully |
| **Polish** | Error boundaries on all pages; skeleton screens on all data panels; reduced-motion support | Verify all error codes match `API_CONTRACT.md` exactly |

**Completion criteria:** All 15 pages live and match approved `frontendHtml/` prototype; all 4 platforms syncing; notifications appear on sync events; UAT sign-off from stakeholder.  
**Risks:** Markdown XSS via question content → sanitization verified with attack payloads in integration test; notification count drift → optimistic update verified.

---

### M6 — Hardening, Observability & Production Deployment
**Objective:** Production-ready. All security, performance, observability, and DevOps checklist items satisfied.  
**Estimated effort:** 7–10 days.  
**Dependencies:** M0–M5.

| Area | Deliverables |
|------|-------------|
| **Security** | Full SECURITY_PLAN critical items verified; OWASP ZAP DAST on staging; pentest on critical flows (OAuth, BOLA, sync trigger, token decrypt); all SECURITY_PLAN §17 checklist items signed off |
| **Performance** | Load test (k6, targets from TESTING_PLAN §3.6); Lighthouse ≥ 90 on key pages; bundle size within budget; code-split heavy islands verified |
| **Observability** | All OBSERVABILITY_PLAN §7 checklist items live: logging, metrics, dashboards, alerts, SLOs, synthetic checks, status page, runbooks |
| **Infra** | All 3 environments on IaC; prod manual-approval gate; CDN + WAF + DNSSEC + HSTS live; backup + PITR + restore drill done; DR documented |
| **A11y + Responsive** | Zero axe violations; keyboard + screen reader tested all 15 pages; viewport matrix 375→1920 verified |
| **Cross-browser** | Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome |
| **Go-live** | Staged rollout (10% → 50% → 100%); monitor error budget; on-call defined; runbooks linked in alerts |

**Completion criteria:** All checklists in DEVOPS_PLAN §7, TESTING_PLAN §8, SECURITY_PLAN §17, OBSERVABILITY_PLAN §7 satisfied. Error budget healthy. Smoke tests passing. Rollback verified.

---

### M7 — Browser Extension (Path B v2) — *parallel track, gated on M1 auth*
**Objective:** Capture the user's own accepted code in-browser and feed git-service, signed in as the same user. Reverses the original "no extension" stance and becomes the **preferred** Path B. Blueprint: [EXTENSION_PLAN.md](EXTENSION_PLAN.md); security: [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md).

| Sub-milestone | Deliverables |
|---------------|-------------|
| **E0 — Auth** | `browser-extension/` scaffold; PKCE handoff → `client=extension` JWT; refresh; `GET /users/me` works (depends on M1 + new `/auth/extension/*` endpoints) |
| **E1 — LeetCode E2E** | content script captures Accepted; background `POST /api/ingest`; GitHub push (proves the full loop) — depends on M4 GitHub publish |
| **E2 — More platforms** | Codeforces, then CodeChef + HackerRank capture |
| **E3 — Cross-browser** | Firefox build (`browser_specific_settings`), then Safari conversion (Apple Developer account) |
| **E4 — UX & control** | Popup (toggles, recent captures, Sync now), options page, session revocation in Settings |
| **E5 — Hardening + stores** | Least-privilege manifest review; Chrome Web Store, Firefox AMO, Edge Add-ons, App Store ([BROWSER_EXTENSION_STORES](../CERTIFICATES_BEFORE_LAUNCH/BROWSER_EXTENSION_STORES.md)) |

**Backend prerequisite:** `/auth/extension/*` (web-backend) + `POST /api/ingest` (git-service) + `client` column on `auth_sessions` — see [API_CONTRACT.md](API_CONTRACT.md) §1.1b, §1.8b.

---

## 3. Critical Path

```
M0 (contract freeze + JWT) 
  → M1 (auth: both services verify JWT) 
    → M2 (connections + token model + stats) 
      → M4 (GitHub publish + sync: consumes connections+tokens)
        → M5 (remaining adapters + notifications + problem detail)
          → M6 (hardening + deploy)

M1-FE (shells + marketing) ─ parallel, independent of M1-BE
M3 (analytics + public profile + settings) ─ parallel with M4 after M2
```

**Hard blockers:**
| Blocker | Blocks |
|---------|--------|
| JWT claim contract freeze | All protected work in both services |
| `AggregatedStats` shape freeze | Overview + Analytics FE wiring |
| Connection + token encryption working | git-service entirely |
| GitHub folder write working | Sync orchestrator (can't test without it) |
| Sync idempotency proven | Scheduler automation (never automate a non-idempotent operation) |

---

## 4. Risk Register & Mitigations

| # | Risk | Type | Probability | Impact | Mitigation |
|---|------|------|------------|--------|-----------|
| R1 | LeetCode GraphQL schema changes | Technical/Integration | High | High | Adapter isolated; integration test with recorded fixtures; monitor weekly; degrade gracefully |
| R2 | Platform session tokens expire frequently | UX/Reliability | High | Medium | Expiry flow robustly designed; stats keep working; Reconnect CTA prominent; scheduled pre-expiry notification |
| R3 | git-service browser key shipped to client | Security | Medium (if not addressed) | Critical | SECURITY_PLAN S1 — resolved in M1; git-service verifies user JWT |
| R4 | DB migration failure in prod | Infrastructure | Low | Critical | expand→migrate→contract pattern; pre-migration backup; staging migration verified before prod |
| R5 | Sync non-idempotent → duplicate commits | Correctness | Medium | High | Unique constraint + per-connection lock + integration test proven before enabling scheduler |
| R6 | GitHub API rate-limit exhaustion during initial bulk sync | Performance | Medium | Medium | Batch commits; rate-limit headroom check; per-user quotas; backoff |
| R7 | FE/BE contract drift | Collaboration | Medium | Medium | Contract tests block merge; PR required to change `API_CONTRACT.md`; daily sync |
| R8 | KMS key unavailable (crypto failure) | Security/Reliability | Low | Critical | KMS HA; fallback plan (pause sync, alert); key rotation runbook |
| R9 | External platform ToS violation notice | Legal | Low | High | User consent flow; own-data-only; keep legal disclosure updated; monitor platform ToS |
| R10 | Scope creep (AI features, pricing, gamification) | Schedule | High | Medium | Hard P0/P1/P2 discipline; deferred features flagged in code; pricing already deferred |
| R11 | Solo bug during M4 (most complex milestone) | Schedule | Medium | Medium | M4 is 10–12 days; allocate buffer; start GitHub publish before sync fetch |
| R12 | Queue worker memory leak under sustained sync load | Performance | Low | Medium | Load test queue workers before enabling scheduler; resource limits on containers |

---

## 5. Final Go-Live Checklist

> Every item must be signed off before production traffic is accepted.

### Foundation
- [ ] All 7 milestones (M0–M6) completion criteria satisfied
- [ ] All 15 pages match approved `frontendHtml/` prototype (UAT sign-off)
- [ ] API contract tests passing (every endpoint in `API_CONTRACT.md` verified)

### Security (SECURITY_PLAN §17)
- [ ] Platform + GitHub tokens envelope-encrypted (KMS); `key_version` in place
- [ ] git-service NOT accessible with static browser key (user-JWT auth verified)
- [ ] GitHub scope minimized (per-repo, not all-repos)
- [ ] BOLA ownership checks verified on every endpoint (dedicated security test suite passes)
- [ ] CSRF protection + OAuth PKCE/state/redirect allowlist verified
- [ ] No secrets in logs/bundle/repo (secret scan clean)
- [ ] SSRF egress allowlist enforced
- [ ] OWASP ZAP DAST clean at Critical/High; pentest sign-off
- [ ] Cookies httpOnly + Secure + SameSite; security headers deployed

### Performance & Quality (TESTING_PLAN §8)
- [ ] All CI quality gates green (lint, typecheck, tests, coverage, SCA, secret scan, a11y, bundle)
- [ ] Load test: p95 `/stats` ≤ 1,500 ms; p95 `/public` ≤ 500 ms; sync burst handled
- [ ] Lighthouse ≥ 90 (performance + a11y) on landing, overview, public profile
- [ ] Zero axe violations across all 15 pages
- [ ] Keyboard nav + screen reader verified on all 15 pages
- [ ] Responsive matrix verified (375 → 1920px+)
- [ ] Cross-browser verified (Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome)

### Infrastructure & Reliability (DEVOPS_PLAN §7)
- [ ] 5 environments on IaC; prod manual-approval gate active
- [ ] Prod Postgres HA + PITR + encrypted daily backup + restore drill done
- [ ] Redis HA; no data loss on restart acceptable (cache/queue)
- [ ] CDN + WAF + DNSSEC + HSTS live; TLS auto-renew working
- [ ] Blue-green / rolling deploy with health gate; rollback tested
- [ ] Sync kill-switch (`SYNC_ENABLED=false`) tested
- [ ] DR runbook written; RPO/RTO targets documented

### Observability (OBSERVABILITY_PLAN §7)
- [ ] Structured logs shipping to sink; redaction verified
- [ ] All dashboards (engineering, ops, product, security) live
- [ ] All alerts in OBSERVABILITY_PLAN §4.2 created + tested
- [ ] PagerDuty escalation + on-call roster defined
- [ ] Status page live and linked from the app footer
- [ ] SLO burn-rate alert configured
- [ ] All runbooks written and linked

### Data & Compliance
- [ ] Account deletion purges `connection_secrets` + revokes OAuth tokens
- [ ] User data export available
- [ ] Consent flow at connect-authorize displays scope + data handling
- [ ] Privacy Policy + Terms of Service current and accurate
- [ ] `audit_logs` 1-year retention confirmed
- [ ] Cookie notice / GDPR banner evaluated (if non-essential cookies used)

### Operations
- [ ] Incident response process documented + team briefed
- [ ] Platform ToS monitored; disclosure in ToS current
- [ ] Runbooks for top-5 incidents written
- [ ] Support channel / contact email live
- [ ] Staged rollout plan ready (10% → 50% → 100%)

---

## 📱 Mobile app (Expo Go)

- **Done:** SDK 54 scaffold, email magic-link auth, full screen set (overview/analytics/repos/sync/inbox/settings/profile/notifications/connect), recent submissions from git-service, 12-month heatmap, branding.
- **Next:** GitHub OAuth (needs backend token-handoff), problem-detail question/solution rendering, message pagination, options/preferences, store/build packaging (EAS).

See [MOBILE_APP.md](MOBILE_APP.md).
