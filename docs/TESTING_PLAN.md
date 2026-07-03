# 🧪 CodeVault — Testing & QA Strategy

> QA Lead specification. **No implementation code** — strategy, pyramid, responsibilities, coverage targets, gates, checklists. Specific to CodeVault's 3-service architecture (web-frontend / web-backend / git-service). Companion to [DEVOPS_PLAN](DEVOPS_PLAN.md) and [API_CONTRACT](API_CONTRACT.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Testing Philosophy

CodeVault's highest-risk behaviours are **not CRUD** — they are token encryption, cross-user data isolation (BOLA), idempotent sync to GitHub, and upstream platform integration. The testing strategy weights heavily toward **integration and contract tests** at the boundaries between services and between the app and external platforms. Unit tests cover business logic; E2E tests verify complete user flows.

**Guiding rules:**
- Every test that touches the database hits a **real ephemeral PostgreSQL** instance — no in-process mocks for DB (lessons from the BACKEND_PLAN §1.1 critique).
- External platform APIs (LeetCode, Codeforces, GitHub) are **always stubbed/mocked** in automated tests — never call live external services in CI.
- **Contract tests** are mandatory; they run against the `API_CONTRACT.md` spec and block merge if they fail.
- Security-related behaviours (BOLA, token leakage, CSRF, rate-limit) have **dedicated security test suites** — not just comments.

---

## 2. Testing Pyramid

```
           ┌─────────────────────┐
           │   E2E (Playwright)   │  ← few, critical paths only
           ├─────────────────────┤
           │ API / Contract tests │  ← every endpoint per API_CONTRACT
           ├─────────────────────┤
           │  Integration tests   │  ← service logic + real DB
           ├─────────────────────┤
           │  Component / Unit    │  ← business logic, UI components
           └─────────────────────┘
   Quantity: many ──────────────────── few
   Speed:    fast ──────────────────── slow
```

| Layer | Scope | Tools | Run on | Count target |
|-------|-------|-------|--------|-------------|
| Unit | Pure functions, utils, validators, transformers, React components (presentational) | Jest / Vitest, React Testing Library (FE), Jest (BE) | Every commit (local + CI) | Highest |
| Component | React components with mocked data, interaction logic | React Testing Library + MSW | Every PR | High |
| Integration | Service + repository + real DB; sync orchestrator logic | Jest + Testcontainers (Postgres/Redis) | Every PR | Medium |
| API / Contract | Every endpoint in `API_CONTRACT.md` — request/response shape, auth, error codes | Supertest (BE), MSW consumer tests (FE) | Every PR (blocks merge) | Medium |
| E2E | Complete user flows through the real UI | Playwright | Pre-merge to main + nightly | Low (golden paths only) |
| Performance | Latency, throughput, concurrent users | k6 | Pre-release + nightly on staging | N/A (threshold pass/fail) |
| Load | Sustained load + queue behaviour | k6 | Pre-release | N/A |
| Stress | Push to breaking point | k6 | Pre-release (one-time) | N/A |
| Security | OWASP test cases (BOLA, CSRF, injection, token leakage) | OWASP ZAP (DAST) + custom Supertest suite | Weekly on staging + pre-release | N/A |
| Accessibility | WCAG AA — axe, keyboard, screen reader | axe-playwright, manual | Every PR (FE) | N/A (zero violations) |
| Cross-browser | Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome | Playwright multi-browser | Pre-release + nightly | N/A |
| Responsive | Viewport matrix (mobile 375 → ultra-wide 1920) | Playwright + Storybook viewports | Every PR (FE) | N/A |

---

## 3. What Each Layer Tests (CodeVault-specific)

### 3.1 Unit tests
- **FE:** utility functions (slug formatter, number pad, extension map, date formatter), validators (Zod schemas), pure presentational components (Button, Pill, StatCard renders correctly with given props), deterministic heatmap seed function, platform colour/badge mapper.
- **BE (web-backend):** aggregation logic (merging stats across platforms), JWT claim builder, token encryption/decryption (happy path + tampered cipher), username validation regex (SSRF-prevention edge cases), error class hierarchy.
- **BE (git-service):** diff logic (which problems are new vs already synced), folder-name formatter, README index generator, problem-number padding.

### 3.2 Component tests
- Every UI-kit primitive (Button, Switch, SegmentedControl, DataTable) with interaction.
- Form components: validation triggers, error messages, submit state.
- Data-viz components (DifficultyRing, ContributionHeatmap, PlatformBreakdown) render correctly from props.
- Auth guard: redirects unauthenticated users.

### 3.3 Integration tests (real DB via Testcontainers)
- **Connections:** create → unique constraint (duplicate platform) → authorize → token stored encrypted → delete → secret purged.
- **Stats aggregation:** connection with mock platform adapter → correct `AggregatedStats` shape returned.
- **Sync orchestrator:** mock platform fetch + mock GitHub push → problems upserted idempotently (re-run = no duplicate) → sync_run created with correct status → connection updated.
- **Token expiry path:** expired token → `SESSION_EXPIRED` error → connection marked expired → notification created.
- **Account deletion:** user deleted → cascade verified → `connection_secrets` hard-deleted → `audit_logs` retained with null user_id.
- **Auth refresh:** rotation → old token rejected → reuse detection → family revoked.

### 3.4 API / Contract tests
Every endpoint in `API_CONTRACT.md` tested with Supertest against a real running service + real DB:
- Happy path: correct request → correct response shape (all required fields present, correct types).
- Auth: missing/invalid/expired JWT → `401 UNAUTHENTICATED`.
- BOLA: User A's token → request for User B's resource → `403 FORBIDDEN` (not 404, not 200).
- Mass assignment: send `role`, `plan`, `userId` in request body → field ignored/rejected.
- Validation: missing required field, out-of-enum value, too-long string → `400 VALIDATION_ERROR` with `details`.
- Rate limiting: exceed threshold → `429 RATE_LIMITED` with correct headers.
- Error shape: every error response matches the standard envelope `{ error: { code, message, requestId } }`.

### 3.5 E2E tests (Playwright — golden paths only)
| Flow | Steps |
|------|-------|
| Sign in | Landing → Login → GitHub OAuth mock → redirect to `/app/overview` → user visible in sidebar |
| Connect platform (stats) | Overview → Connect → fill LeetCode handle → stats-only mode → connection appears in settings |
| Dashboard loads data | Overview → all panels render (stat cards, ring, heatmap, platform bars) |
| Public profile shareable | Overview → Public Profile → enable → copy link → open in incognito → renders correctly |
| Settings: disconnect | Settings → Platforms → Disconnect → ConfirmDialog → connection removed → toast |
| Notifications: mark read | Notifications → "Mark all as read" → bell count goes to 0 |
| Sync trigger | Sync Status → "Run sync now" → 202 accepted → status updates |
| Logout | Topbar → Logout → redirected to `/login` → `/app` rejects (guard works) |

### 3.6 Performance tests (k6 on staging)
| Test | Target | Threshold |
|------|--------|-----------|
| `GET /stats` under load | 50 concurrent users | p95 latency ≤ 800 ms |
| `GET /public/:username` | 200 concurrent visitors | p95 ≤ 300 ms (cache hit) |
| Sync trigger burst | 20 users trigger simultaneously | all queued (202), no 5xx |
| Dashboard load (mixed) | 100 concurrent sessions | p95 ≤ 1s, error rate < 1% |

### 3.7 Security tests (dedicated suite — mandatory pre-release)
- BOLA scan: enumerate connection IDs, problem IDs, sync run IDs with another user's token → all 403.
- CSRF: mutation without `X-CSRF-Token` → 403.
- Token in logs: grep log output for `sessionToken`, `cipher`, `Authorization` header value → must not appear.
- SQL injection: parameterised-query confirmation (Prisma); any `queryRaw` calls get injection payloads → no data leak.
- Public profile PII: response must not contain `email`, `tokenStatus`, `sessionToken`.
- SSRF: username field with `localhost`, `169.254.169.254`, `file://` → rejected with 400.
- Rate limit enforcement: auth endpoint burst → 429 within threshold.
- XSS via upstream content: platform-sourced title with `<script>` → rendered as text, not executed.

---

## 4. Testing Responsibilities

| Area | FE dev | BE dev | Shared |
|------|--------|--------|--------|
| UI kit unit/component tests | ✅ primary | — | — |
| Page/feature component tests | ✅ primary | — | — |
| Form validation tests | ✅ primary | — | — |
| A11y, responsive, cross-browser | ✅ primary | — | — |
| API contract (consumer side / MSW mocks) | ✅ primary | — | review |
| Backend unit (logic, crypto, diff) | — | ✅ primary | — |
| Integration tests (DB + service) | — | ✅ primary | — |
| API contract (provider side / Supertest) | — | ✅ primary | review |
| Security test suite | — | ✅ primary | review |
| E2E flows (Playwright) | ✅ write scenarios | ✅ keep backend stable | ✅ shared ownership |
| Performance / load tests | — | ✅ primary | — |
| Test data / fixtures | — | ✅ primary (DB seed) | FE supplies MSW fixtures |
| CI pipeline gates | — | — | ✅ both |

---

## 5. Coverage Targets

> Coverage is a **floor**, not a goal. 80% with bad tests is worse than 60% with meaningful ones. Focus coverage on the **risk-weighted** modules.

| Module | Target | Priority |
|--------|--------|----------|
| Token encryption/decryption | **100%** | critical |
| Auth (JWT issue/verify/refresh/reuse) | **100%** | critical |
| Ownership/BOLA middleware | **100%** | critical |
| Sync orchestrator (diff, idempotency) | **≥ 90%** | high |
| Stats aggregation | **≥ 90%** | high |
| All API routes (contract tests count) | **≥ 85%** | high |
| UI kit components | **≥ 80%** | medium |
| Feature pages/components | **≥ 70%** | medium |
| Utilities / helpers | **≥ 80%** | medium |
| Landing/legal pages | **≥ 50%** | low |

---

## 6. CI Quality Gates (must pass before merge to `main`)

| Gate | Tool | Fails on |
|------|------|---------|
| ✅ Lint | ESLint (FE+BE) | any error |
| ✅ Format | Prettier | diff detected |
| ✅ Typecheck | tsc --noEmit | any type error |
| ✅ Build | Next.js build / tsc compile | build failure |
| ✅ Unit + integration | Jest/Vitest | any failure |
| ✅ Contract conformance | Supertest suite | shape/status mismatch |
| ✅ Coverage | Jest --coverage | below module targets |
| ✅ SCA | Dependabot / npm audit | HIGH+ severity CVE |
| ✅ Secret scan | gitleaks | any secret pattern detected |
| ✅ SAST | CodeQL / Semgrep | HIGH+ finding |
| ✅ Bundle size | bundlesize / Next analytics | > budget (FE only) |
| ✅ A11y | axe-playwright | any violation (FE only) |
| ✅ Lighthouse | CI Lighthouse | perf/a11y < 90 (FE key pages) |
| ✅ E2E (golden paths) | Playwright | any golden-path failure |

> **Staging-only gates** (before prod release): load test thresholds, security (ZAP DAST), cross-browser, responsive matrix, pentest sign-off.

---

## 7. Test Data Strategy

| Layer | Strategy |
|-------|----------|
| **Unit / component** | Inline factories / builders (typed, minimal, co-located with test) |
| **Integration (BE)** | **Testcontainers** spins real Postgres + Redis per test run; seed via typed factory functions in `tests/factories/`; each test suite creates + cleans its own data |
| **API (Supertest)** | Real ephemeral DB + seeded test users per suite; each test is isolated (transaction rollback or truncate) |
| **E2E (Playwright)** | Dedicated staging environment with seeded test accounts; reset between runs via API endpoint (`/test/reset` — only available in test env, never prod) |
| **FE component (MSW)** | MSW handlers mirror every API_CONTRACT endpoint; typed response factories ensure parity with BE contract; stored in `src/tests/mocks/` |
| **Performance (k6)** | Seed staging with realistic data volume (N users × M problems each) before each load test run |
| **Security** | Dedicated attacker/victim user pair in test DB; never use real user credentials |

**Fixture organisation:**
```
tests/
  factories/      ← typed object builders (User, Connection, Problem, etc.)
  mocks/          ← MSW handlers (FE), nock/jest stubs (BE platform APIs)
  fixtures/       ← static JSON for deterministic edge cases
  helpers/        ← DB seeder, test client, auth helper
```

---

## 8. Release Readiness Checklist (QA slice)

**Automated (CI must be green):**
- [ ] All unit + integration + contract tests pass
- [ ] Coverage at or above all module targets
- [ ] Bundle size within budget; Lighthouse ≥ 90 on key pages
- [ ] Zero axe a11y violations on all 15 pages
- [ ] SAST/SCA/secret scan clean (or mitigated)
- [ ] E2E golden paths passing on staging

**Manual (sign-off required):**
- [ ] Load test: p95 latency targets met; sync burst handled
- [ ] OWASP ZAP DAST scan reviewed; critical/high findings resolved
- [ ] Security test suite (BOLA, CSRF, token-leak, SSRF, XSS) all passing
- [ ] Cross-browser matrix verified (Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome)
- [ ] Responsive matrix verified (375px → 1920px+)
- [ ] Keyboard navigation + screen reader tested on all 15 pages
- [ ] UAT: every page matches approved `frontendHtml/` prototype (stakeholder sign-off)
- [ ] Pentest findings (SECURITY_PLAN §18) reviewed + resolved at Critical/High
