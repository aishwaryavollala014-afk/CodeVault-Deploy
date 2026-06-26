# 📊 CodeVault — Observability & Monitoring Plan

> SRE specification. **No implementation code** — logging strategy, metrics, dashboards, alerting, SLOs, and incident response. Specific to CodeVault's 3-service (web-frontend / web-backend / git-service) + external-platform topology. Companion to [DEVOPS_PLAN](DEVOPS_PLAN.md) and [SECURITY_PLAN §12](SECURITY_PLAN.md).

---

## 0. Observability Pillars

```
Logs ──────────▶ structured, searchable, correlated by requestId / jobId
Metrics ────────▶ counters, gauges, histograms — for dashboards + alerting
Traces ─────────▶ (optional P2) distributed tracing across web-backend + git-service
Alerts ─────────▶ actionable, tiered (page vs warn vs info)
SLOs ───────────▶ user-facing reliability targets + error budgets
```

**Core tooling recommendation:**
| Component | Tool |
|-----------|------|
| Structured logging | **pino** (already in plan) → shipped to **Logtail / Axiom / Datadog Logs** |
| Metrics | **Prometheus-compatible** (prom-client) → **Grafana** or **Datadog Metrics** |
| Error tracking | **Sentry** (FE + BE) — captures unhandled exceptions with context |
| Uptime / synthetic | **Better Uptime / UptimeRobot** — external health pings |
| Alerting | PagerDuty / OpsGenie (page) + Slack (warn/info) |
| Traces (P2) | OpenTelemetry → Jaeger or Datadog APM |

---

## 1. Logging Strategy

### 1.1 Log schema (all services emit this shape)
Every log line is **structured JSON** with:
```
{
  timestamp: ISO-8601 UTC,
  level: debug|info|warn|error,
  service: web-backend|git-service|web-frontend,
  requestId: uuid (injected by middleware on every request),
  jobId: uuid (injected in every worker job),
  userId: uuid | null (from JWT, NEVER email/handle),
  action: string (e.g. "stats.fetch", "sync.push", "auth.refresh"),
  durationMs: number (where applicable),
  statusCode: number (API logs),
  message: string,
  error: { code, message } | null,
  metadata: { platform?, connectionId?, problemCount? } — NO secrets/PII
}
```

**Hard rules:** ❌ Never log `sessionToken`, `tokenCipher`, `Authorization` header value, `email`, `code` (source), `csrfToken`, stack traces in production. Redaction middleware strips these before the log sink.

### 1.2 Log types and levels

| Log type | Level | When | Retention |
|----------|-------|------|-----------|
| **Application** (request in/out) | info | Every request + response | 30 days |
| **API access** | info | Method, path, status, latency, userId, requestId | 30 days |
| **Authentication** | info/warn | Login, logout, refresh, OAuth callback, failed auth | 90 days |
| **Authorization failure** | warn | 403, BOLA attempt, missing ownership | 90 days |
| **Sync job** | info | Job start, items fetched/pushed, duration, outcome | 30 days |
| **Platform integration** | info/warn | Upstream call, latency, status code, rate-limit hit | 30 days |
| **Error** | error | Unhandled exceptions, 5xx, job failures | 90 days |
| **Audit** (security) | info | Connect/disconnect, token rotate, delete, admin action | **1 year** (DB + log sink) |
| **Infrastructure** | info | Health checks, deployment events, scale events | 14 days |
| **Debug** | debug | Dev/staging only; never in prod | 24 hours (ephemeral) |

### 1.3 Log pipeline
```
App (pino) ─▶ stdout (JSON) ─▶ platform log collector ─▶ log sink (Logtail/Datadog)
                                                           ─▶ alert rules
                                                           ─▶ search / dashboards
```
FE: Sentry captures client exceptions; Next.js server logs via stdout.

---

## 2. Metrics

### 2.1 Service metrics (web-backend + git-service)

| Metric | Type | Labels | Why |
|--------|------|--------|-----|
| `http_requests_total` | Counter | service, method, path, status | Request volume + error rate |
| `http_request_duration_ms` | Histogram | service, method, path, status | Latency percentiles |
| `http_request_size_bytes` | Histogram | service | Payload size |
| `auth_attempts_total` | Counter | type(oauth/refresh/logout), result(ok/fail) | Auth health |
| `auth_failures_total` | Counter | reason(expired/invalid/reuse) | Security signal |
| `platform_fetch_total` | Counter | platform, result(ok/fail/ratelimit) | Integration health |
| `platform_fetch_duration_ms` | Histogram | platform | Upstream latency |
| `stats_cache_hits_total` / `_misses_total` | Counter | platform | Cache effectiveness |
| `sync_jobs_enqueued_total` | Counter | trigger(schedule/manual) | Queue volume |
| `sync_jobs_completed_total` | Counter | status(success/partial/failed/expired) | Sync health |
| `sync_job_duration_ms` | Histogram | platform | Sync performance |
| `sync_items_fetched_total` | Counter | platform | Volume |
| `sync_items_pushed_total` | Counter | platform | GitHub push volume |
| `token_decrypt_total` | Counter | result(ok/fail) | ⚠️ Decryption failures = security signal |
| `active_connections_total` | Gauge | platform, status(active/expired) | Connection health |

### 2.2 Queue metrics (Redis / BullMQ)

| Metric | Type | Why |
|--------|------|-----|
| `queue_depth` | Gauge | Backlog build-up → scaling signal |
| `queue_wait_duration_ms` | Histogram | How long jobs wait |
| `queue_active_workers` | Gauge | Worker utilization |
| `queue_failed_jobs_total` | Counter | Worker failure rate |
| `queue_stalled_jobs_total` | Counter | Stuck job detection |

### 2.3 Infrastructure metrics

| Metric | Source |
|--------|--------|
| CPU / memory / disk per service | Platform (Render/Fly/ECS) |
| DB: connections, query latency, lock waits, replication lag | Postgres exporter |
| Redis: memory usage, eviction rate, command latency, hit rate | Redis exporter |
| Network: egress bytes, error rate | Platform |
| Container restarts | Platform |

### 2.4 Business / product metrics

| Metric | How |
|--------|-----|
| Active users (DAU/WAU/MAU) | Auth login events counted |
| Connected platforms per user | `connections` table aggregate |
| Problems synced total | `problems` table count |
| Public profiles enabled | `users.public_profile_enabled` |
| Sync success rate | `sync_runs` aggregate |
| Platform breakdown | `connections.platform` distribution |

---

## 3. Dashboards

### 3.1 Engineering dashboard (real-time operations)
- Request rate + error rate (all 3 services) — time series
- p50/p95/p99 latency per endpoint group
- Auth failure rate + token-decrypt failures
- Active sync jobs + queue depth + worker utilization
- Platform integration health (per platform: success rate, latency)
- GitHub API usage (remaining rate-limit budget)
- DB: connection pool, query latency, slow queries
- Redis: hit rate, memory, eviction

### 3.2 Operations dashboard (infra health)
- Service uptime + error rate (RAG status: green/amber/red)
- CPU/memory per service + auto-scale events
- DB replica lag + backup status
- Queue depth + stalled jobs
- Deployment events timeline
- Failed health checks

### 3.3 Product dashboard (weekly cadence)
- New user signups + active users trend
- Platform connection distribution (LeetCode vs CF vs CC vs HR)
- Problems synced per day/week
- Public profiles created
- Sync success rate
- Most common sync failure reasons

### 3.4 Security dashboard (daily review)
- Auth failure spike (credential stuffing signal)
- 403 rate + BOLA attempt pattern
- Token-decrypt failure count
- Rate-limit triggers per IP
- Anomalous sync volume per user
- New admin logins / privilege use

---

## 4. Alerting

### 4.1 Alert tiers
| Tier | Channel | Response time | Examples |
|------|---------|--------------|---------|
| 🔴 **Page** | PagerDuty → on-call | Immediate | DB down, auth broken, 5xx > 5%, token-decrypt failures |
| 🟠 **Warn** | Slack #alerts | Within 1 hour | Elevated latency, queue backlog, platform down, sync failure spike |
| 🟡 **Info** | Slack #infra | Next business day | Rate-limit surge, high cache miss rate, stale backup |

### 4.2 Alert definitions (CodeVault-specific)

| Alert | Condition | Tier | Runbook |
|-------|-----------|------|---------|
| **Service 5xx spike** | error rate > 5% over 5 min | 🔴 Page | Check logs for root cause; rollback if deploy-related |
| **DB unreachable** | health check fails 3× | 🔴 Page | Failover to replica; notify users |
| **Auth broken** | `/auth/session` failure rate > 10% | 🔴 Page | JWT key issue or provider outage |
| **Token decrypt failures** | > 3 decrypt errors in 5 min | 🔴 Page | Potential KMS issue or data corruption; **security event** |
| **Failed deployment** | CI/CD deploy step fails | 🔴 Page | Check pipeline; revert if needed |
| **Queue stalled** | stalled jobs > 5 for 10 min | 🟠 Warn | Worker crash or lock issue; restart workers |
| **Queue backlog** | depth > 100 jobs | 🟠 Warn | Scale workers or check for platform outage |
| **Sync failure spike** | sync failure rate > 30% over 1 hr | 🟠 Warn | Platform down or schema change; check adapter |
| **Platform API down** | consecutive failures > 10 for one platform | 🟠 Warn | Mark platform degraded; serve `stats_snapshots` |
| **GitHub API rate limit** | remaining < 100 | 🟠 Warn | Pause sync; spread requests |
| **High latency** | p95 > 2s for `/stats` or `/public` | 🟠 Warn | Cache miss storm or upstream slow |
| **Auth failure spike** | auth failures > 50/min | 🟠 Warn | Credential stuffing / bot attack |
| **403 spike** | > 20 403s/min same IP | 🟠 Warn | BOLA scan / attacker; consider IP block |
| **Redis memory high** | usage > 80% | 🟡 Info | Review cache TTLs; scale Redis |
| **Backup stale** | last backup > 25 hours | 🟡 Info | Check backup job |
| **Replica lag** | > 60 seconds | 🟡 Info | Monitor; check DB load |

---

## 5. SLOs & SLIs

> Targets appropriate for a **small-team product** at launch. Tighten as user base grows.

| Service | SLI | SLO (target) | Measurement window |
|---------|-----|--------------|-------------------|
| **API availability** (web-backend + git-service) | % of requests returning non-5xx | **99.5%** | Rolling 30 days |
| **Dashboard load** (`GET /stats`) | % requests < 1,500 ms | **95%** | Rolling 7 days |
| **Public profile load** (`GET /public/:username`) | % requests < 500 ms (cache hit expected) | **99%** | Rolling 7 days |
| **Sync job success** | % of sync runs completing without `failed` status | **95%** | Rolling 7 days |
| **Auth flow** (`/auth/github/callback` → `/auth/session`) | % completing successfully | **99.9%** | Rolling 30 days |
| **GitHub push success** | % of enqueued push operations succeeding | **98%** | Rolling 7 days |

**Error budget:**
- 99.5% availability over 30 days = **3.65 hours downtime budget/month**
- Burn rate alert: if 5% of monthly budget burned in 1 hour → page

---

## 6. Incident Response

### 6.1 Detection → escalation flow
```
Alert fires ─▶ on-call notified (PagerDuty) ─▶ acknowledge within 15 min
                                              ─▶ triage: severity + scope
                                              ─▶ Sev1 (data loss / auth broken / token exposure): escalate immediately
                                              ─▶ Sev2 (degraded service, platform down): resolve within 2 hr
                                              ─▶ Sev3 (performance, non-critical): resolve within 24 hr
```

### 6.2 Severity definitions (CodeVault-specific)

| Severity | Definition | Examples |
|----------|-----------|---------|
| **Sev 1** | User data at risk or service completely unavailable | Token store breach, auth broken, DB down |
| **Sev 2** | Degraded but functional (some users affected) | Sync not working, one platform down, latency elevated |
| **Sev 3** | Minor issue, no user impact | High cache miss rate, slow background job, info alert |

### 6.3 Communication plan

| Audience | Channel | When |
|---------|---------|------|
| Internal (dev/ops) | Slack #incidents | As soon as declared |
| Users (Sev1) | Status page + in-app notification | Within 30 min of declaration |
| Users (Sev2) | Status page | Within 1 hr |
| GDPR regulator (data breach) | Formal notification | Within **72 hours** (GDPR requirement) |

### 6.4 Pre-written runbooks (one per top risk)

| Runbook | Trigger |
|---------|---------|
| **Token store breach** | Sev1 — decrypt failures, unauthorized DB access detected |
| **GitHub token abuse** | Sev1 — unexpected commits on user repos |
| **Auth service down** | Sev1 — `/auth/session` failing |
| **Sync queue dead** | Sev2 — all sync jobs stalled |
| **Platform schema change** | Sev2 — adapter throwing parse errors |
| **GitHub API exhausted** | Sev2 — rate limit remaining = 0 |
| **Dependency CVE** | Sev2/3 — npm audit / Dependabot critical alert |

**Token store breach runbook (summary):** pause all sync → rotate KMS key → invalidate all refresh tokens (force re-login) → audit `audit_logs` for unauthorized access → notify affected users to re-authorize platforms (treat all stored tokens as compromised) → GDPR notification if EU users affected.

### 6.5 Recovery & postmortem

**Recovery steps:** Identify → contain (kill-switch: `SYNC_ENABLED=false`) → fix → verify on staging → deploy → monitor → all-clear.

**Postmortem process (blameless):**
1. Write within 48 hours of resolution.
2. Timeline of events (detection → resolution).
3. Root cause (5-whys).
4. Impact (users affected, duration, data at risk).
5. Action items (with owners + due dates) — what detection, prevention, mitigation to add.
6. Share with team; store in `docs/postmortems/`.

---

## 7. Observability Readiness Checklist

- [ ] Structured logging (JSON) shipping to sink on all 3 services
- [ ] Redaction middleware active — no tokens/PII in logs
- [ ] `requestId` and `jobId` in every log line; correlated in errors
- [ ] Sentry wired for FE + BE unhandled exceptions
- [ ] Prometheus metrics endpoint exposed (internal only) on BE services
- [ ] Engineering + Security dashboards live in Grafana/Datadog
- [ ] All alerts in §4.2 created and tested (fire + resolve)
- [ ] PagerDuty escalation policy configured; on-call roster defined
- [ ] Status page live (Instatus / Statuspage) with components: API, Sync, GitHub sync, Database
- [ ] SLO burn-rate alerts configured
- [ ] Runbooks written and linked in alert definitions
- [ ] Uptime synthetic checks on `/health` (every 1 min from 3 regions)
- [ ] Log retention policies set; audit logs 1-year retention
