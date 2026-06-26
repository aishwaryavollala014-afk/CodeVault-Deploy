# 🚀 CodeVault — DevOps & Deployment Plan

> DevOps/SRE specification. **No code/config/scripts** — strategy, decisions, matrices, checklists. Three deployables: **web-frontend** (Next.js), **web-backend** (Express), **git-service** (Express + cron/workers). Stores **PostgreSQL** + **Redis**. Companion to [BACKEND_PLAN](BACKEND_PLAN.md), [SECURITY_PLAN](SECURITY_PLAN.md), [DATABASE_PLAN](DATABASE_PLAN.md).

---

## 1. Environment Strategy

| Aspect | Local | Development | Testing (CI) | Staging | Production |
|--------|-------|-------------|--------------|---------|-----------|
| **Purpose** | dev on laptop | shared integration sandbox | automated test runs | prod-mirror pre-release | live users |
| **Infra** | Docker compose / local procs | small managed instances | ephemeral CI runners | same shape as prod, smaller | full HA |
| **DB** | local Postgres + Redis | shared dev DB (disposable) | **ephemeral DB per CI run** (spun up + torn down) | dedicated staging DB (prod-like, anonymized) | managed Postgres (HA, PITR) + Redis |
| **Branch mapping** | any feature branch | `develop` (optional) or PR previews | every PR | `main` | release tag (`vX.Y.Z`) |
| **Deploy trigger** | manual | push to `develop` / PR preview | PR opened/updated | merge to `main` (auto) | tag + **manual approval** |
| **Env vars** | `.env.local` (dev secrets) | dev secret set | CI secrets (mocked externals) | staging secret set | prod secret set (KMS) |
| **Secrets mgmt** | local `.env` (gitignored) | secret manager (dev scope) | CI encrypted secrets | secret manager (staging) | secret manager + KMS, least-priv |
| **Access** | developer only | both devs | CI bot | devs + reviewers | restricted; prod access audited, break-glass only |

**Decisions/why:** ephemeral CI DB = deterministic tests, no shared-state flakiness. Staging mirrors prod shape (not size) so deploys/migrations are validated identically before release. Production deploy is **gated by manual approval** because a bad migration on the token store is high-blast-radius.

---

## 2. Infrastructure

| Layer | Recommendation | Why |
|------|----------------|-----|
| **Frontend hosting** | **Vercel** (Next.js native) | SSR/ISR for public profile, edge CDN, preview deploys per PR, zero-config Next |
| **Backend hosting (web-backend)** | container PaaS (**Render / Railway / Fly.io**) or AWS ECS/Fargate | stateless HTTP, autoscale, simple rollbacks |
| **git-service hosting** | container **web + separate worker process** | sync runs as background workers, scale independently of API |
| **Database** | **managed PostgreSQL** (Neon / Supabase / RDS) | HA, PITR, backups, read replicas later |
| **Redis** | managed (**Upstash / ElastiCache**) | cache + rate-limit + BullMQ queue |
| **Object storage** | **none required** (no file uploads; use GitHub avatars) — optional R2/S3 only for OG images | matches SECURITY_PLAN "no upload" decision; smaller surface |
| **CDN** | Vercel edge (FE) + Cloudflare (apex/WAF) | static caching, DDoS, TLS |
| **DNS** | **Cloudflare** | DNSSEC, CAA, proxy/WAF, fast |
| **Reverse proxy** | platform-managed (Vercel/PaaS) or Cloudflare in front of backends | TLS, request limits, header normalization |
| **SSL/TLS** | managed certs, auto-renew, TLS 1.2+; HSTS preload | standard |

**Topology**
```
Cloudflare(DNS+WAF) ─▶ Vercel (web-frontend, edge/SSR/ISR)
                    ─▶ PaaS LB ─▶ web-backend (N replicas, stateless)
                    ─▶ PaaS LB ─▶ git-service API (N replicas)
                                   git-service workers (M, queue consumers)
                                        │
                          managed Postgres (HA, replicas) + Redis (cache/queue) + KMS
```

> **git-service is private-leaning:** even if browser calls it (per chosen topology), put it behind WAF + strict CORS + user-JWT auth (SECURITY_PLAN S1). Workers run with **no public ingress**.

---

## 3. Infrastructure as Code (IaC)

- **Tool:** **Terraform** (mature, multi-provider, large ecosystem) — or Pulumi if the team prefers TS. *Justification:* declarative, reviewable, reproducible across dev/staging/prod.
- **Organization:** per-environment workspaces + reusable modules (`network`, `database`, `redis`, `service`, `dns`). One module instantiated 3× (dev/staging/prod) with different vars → environments stay identical in shape.
- **State management:** **remote state** (Terraform Cloud / S3+DynamoDB lock) — encrypted, locked, never local. Separate state per environment to limit blast radius.
- **Resource lifecycle:** `plan` on PR (review diff) → `apply` on merge to env branch; destroy ephemeral envs automatically; **prevent_destroy** on prod DB/KMS.
- **Secrets in IaC:** never hardcoded; reference the secret manager; KMS keys created by IaC but values never in state in plaintext.

---

## 4. CI/CD Pipelines (GitHub Actions recommended)

> Each pipeline lists: trigger → stages. (Conceptual — no YAML.)

### 4.1 Frontend (web-frontend)
```
Trigger: PR + push to main
build → lint → typecheck → unit/component tests → a11y (axe) + Lighthouse budget
      → bundle-size check → SCA + secret scan → preview deploy (PR) / prod deploy (main, gated)
      → post-deploy smoke (health + key routes) → (rollback: redeploy previous immutable build)
```

### 4.2 Backend (web-backend) & git-service
```
Trigger: PR + push to main (path-filtered per service)
build → lint → typecheck → unit + integration (ephemeral DB) → SAST + SCA + secret scan
      → contract-conformance tests (API_CONTRACT) → build immutable image → push to registry
      → deploy (staging auto / prod gated) → DB migrate (expand step) → health/readiness check
      → smoke tests → (rollback: redeploy previous image + down-migrate if safe)
```

### 4.3 Database migrations
```
Trigger: migration files changed
validate (dry-run on shadow DB) → review (PR) → apply on staging → verify
      → apply on prod during deploy (expand→migrate→contract; never destructive in one step)
Rollback: tested down-migration or forward-fix; backup taken pre-migration
```

### 4.4 Infrastructure
```
Trigger: IaC changes
terraform fmt/validate → plan (comment on PR) → security scan (tfsec) → apply on merge (env-scoped, approval for prod)
```

### 4.5 Deployment & Rollback (cross-cutting)
- **Strategy:** immutable artifacts (images/builds) + **blue-green or rolling** with health gates; **canary optional** for git-service workers.
- **Health checks:** `/health` (liveness) + `/ready` (DB/Redis reachable) gate traffic.
- **Rollback:** one-command redeploy of previous immutable artifact; DB uses expand/contract so app rollback never breaks schema; **kill-switch to pause all sync** (SECURITY_PLAN IR).

**Pipeline stage matrix**
| Stage | FE | web-backend | git-service | DB | IaC |
|------|----|-------------|-------------|----|----|
| Lint/format | ✓ | ✓ | ✓ | — | ✓ |
| Typecheck | ✓ | ✓ | ✓ | — | — |
| Unit/component | ✓ | ✓ | ✓ | — | — |
| Integration (ephemeral DB) | mock | ✓ | ✓ | ✓ | — |
| Contract conformance | (consumer) | ✓ | ✓ | — | — |
| SAST/SCA/secret-scan | ✓ | ✓ | ✓ | — | tfsec |
| A11y/perf budget | ✓ | — | — | — | — |
| Build artifact | ✓ | ✓ | ✓ | — | plan |
| Deploy + health | ✓ | ✓ | ✓ | migrate | apply |
| Smoke + rollback ready | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 5. Environment Variable Matrix

| Category | Examples | Secret? | Which envs | Rotation |
|----------|----------|---------|-----------|----------|
| Runtime | `NODE_ENV`, `PORT`, `LOG_LEVEL` | public | all | n/a |
| Frontend public | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GIT_SERVICE_URL` | public | all | on URL change |
| Database | `DATABASE_URL` (per service role) | **secret** | dev/test/staging/prod | quarterly + on incident |
| Redis | `REDIS_URL` | **secret** | all (test ephemeral) | quarterly |
| App crypto | `JWT_SECRET`/signing key, `MASTER_ENCRYPTION_KEY`/KMS ref | **secret (critical)** | all | 90 days; key_version supports rotation |
| GitHub OAuth | `GITHUB_CLIENT_ID` (public), `GITHUB_CLIENT_SECRET` (secret) | mixed | all | on suspicion / annually |
| GitHub API | repo-scoped token / App credentials | **secret** | staging/prod | per GitHub policy |
| Platform sync | per-platform config; user session tokens are **in DB, not env** | n/a (DB, encrypted) | — | user re-connect on expiry |
| Inter-service | (option A) shared JWT verification key; (option B) `INTERNAL_API_KEY` server-only | **secret** | all | 90 days |
| Observability | log sink token, metrics API key, error-tracking DSN | **secret** | staging/prod | annually |
| Scheduling | `SYNC_INTERVAL_MINUTES`, queue concurrency caps | public | all | n/a |

**Rules:** secrets only via secret manager (not committed); `MASTER_ENCRYPTION_KEY` + `JWT_SECRET` are crown-jewel; **never** ship the inter-service key to the browser (S1).

---

## 6. Scaling Strategy

| Dimension | Plan |
|----------|------|
| **Auto-scaling** | web-backend + git-service API scale on CPU/RPS; **git-service workers scale on queue depth** |
| **Load balancing** | platform LB; stateless services (JWT + Redis) → scale horizontally freely |
| **Caching** | Redis for stats + public profile (TTL); CDN for static/SSG; ISR for public profile |
| **Database scaling** | vertical first → **read replicas** for stats/public reads → partition high-volume tables (problems/sync_runs/audit) → shard by `hash(user_id)` if needed (DATABASE_PLAN §12) |
| **Storage scaling** | minimal (no uploads); GitHub holds code; OG images on CDN |
| **CDN** | Vercel edge + Cloudflare; cache static + public profile HTML |
| **Horizontal scaling** | all 3 services stateless; workers independently scalable |
| **Disaster recovery** | managed DB PITR + daily encrypted backups (restore-tested); multi-AZ; IaC enables rebuild; **RPO ≤ 15 min, RTO ≤ 1 hr** targets; KMS keys backed up separately; runbook for region failover |

> **Cost/scale note:** sync is the expensive path — cap worker concurrency + per-user quotas to avoid runaway upstream calls and bills (ties to abuse prevention).

---

## 7. Deployment Readiness (DevOps slice)
- [ ] 5 environments provisioned via IaC; prod has manual-approval gate
- [ ] CI green on all 3 services + DB + IaC; contract conformance passing
- [ ] Secrets in manager; crypto keys in KMS; no secrets in repo/CI logs
- [ ] Migrations expand→contract; pre-migration backup; rollback tested
- [ ] Health/readiness probes wired; blue-green/rolling with health gates
- [ ] Backups + PITR + **restore drill** done; DR RPO/RTO documented
- [ ] Sync kill-switch + worker concurrency caps configured
- [ ] CDN/WAF/DNSSEC/HSTS live; TLS auto-renew verified
```
```
> Next: pair with [TESTING_PLAN](TESTING_PLAN.md) (quality gates), [OBSERVABILITY_PLAN](OBSERVABILITY_PLAN.md) (health/alerts), and [ROADMAP](ROADMAP.md) (when each lands).
