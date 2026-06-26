# 📊 CodeVault — Monitoring & Logging

> Practical monitoring/logging guide for CodeVault, complementing the strategy in [OBSERVABILITY_PLAN](OBSERVABILITY_PLAN.md). Focuses on what to instrument in `web-backend`, `git-service`, Postgres, Redis, and the queue — and the security signals that page on-call.

---

## 1. Purpose

Detect failures, performance regressions, and **security events** early, with end-to-end correlation (`requestId`/`jobId`) and zero secret leakage in logs.

---

## 2. Architecture

```
services (pino JSON, redacted) → stdout → collector → log sink (Logtail/Datadog)
services (prom-client) → /metrics (internal) → Prometheus → Grafana
FE + BE unhandled exceptions → Sentry
synthetic pings → /health from 3 regions → status page
```

---

## 3. Best Practices

- **Structured JSON logs** with `requestId`, `jobId`, `userId` (never email/handle), `action`, `durationMs`, `statusCode`.
- **Redaction** of `authorization`, `cookie`, `*.token`, `*.code`, PII — already configured in `lib/logger.ts`.
- **Correlation**: `requestId` on every HTTP log + error body; `jobId` on every worker log.
- **RED metrics** (Rate, Errors, Duration) per endpoint group; **USE** for infra.

---

## 4. Threats / Failure Modes (what we watch)

5xx spikes · auth-failure spikes (credential stuffing) · **token-decrypt failures** (KMS/tamper — security event) · 403 spikes (BOLA/enumeration scans) · queue backlog/stalls · platform-API outages · DB saturation / replica lag · GitHub rate-limit exhaustion.

---

## 5. Prevention / Detection Techniques

| Signal | Alert | Tier |
|--------|-------|------|
| 5xx > 5% / 5 min | page | 🔴 |
| `/auth/session` failure > 10% | page | 🔴 |
| token-decrypt failures > 3 / 5 min | page (security) | 🔴 |
| queue stalled > 5 / 10 min | warn | 🟠 |
| sync failure rate > 30% / 1 hr | warn | 🟠 |
| 403 > 20/min same IP | warn (IDOR scan) | 🟠 |
| GitHub remaining < 100 | warn | 🟠 |
| Redis memory > 80% / replica lag > 60s | info | 🟡 |

---

## 6. Implementation Guidelines

- Expose a Prometheus `/metrics` endpoint (internal only) on both backends.
- Counters: `http_requests_total`, `auth_failures_total`, `platform_fetch_total`, `sync_jobs_completed_total{status}`, `token_decrypt_total{result}`.
- Histograms: `http_request_duration_ms`, `sync_job_duration_ms`, `platform_fetch_duration_ms`.
- Gauges: `queue_depth`, `active_connections_total{status}`.
- Append-only **audit log** for connect/disconnect/authorize/delete/admin.

---

## 7. Folder Structure

```
<service>/src/lib/logger.ts          # pino + redaction (implemented)
<service>/src/middlewares/requestId.middleware.ts
<service>/src/metrics/ (future)      # prom-client registry + /metrics route
docs/OBSERVABILITY_PLAN.md           # full strategy, dashboards, SLOs
```

---

## 8. Recommended Libraries

`pino` + `pino-http` (logs), `prom-client` (metrics), `@sentry/node` + `@sentry/nextjs` (errors), OpenTelemetry SDK (traces, P2), Better Uptime/UptimeRobot (synthetic).

---

## 9. Configuration Examples

```ts
// pino redaction (already in lib/logger.ts)
redact: { paths: ['req.headers.authorization','req.headers.cookie','*.token','*.code'], censor: '[redacted]' }
```
```
LOG_LEVEL=info        # debug only in dev/staging
SENTRY_DSN=...        # staging/prod
```

---

## 10. Production Considerations

- Ship logs to an encrypted sink; retention: app 30d, auth/authz 90d, **audit 1 year**.
- SLOs: API availability 99.5% (30d), `/stats` p95 < 1.5s, `/public` p95 < 500ms, sync success 95% — burn-rate alerts.
- Dashboards: Engineering, Operations, Product, **Security** (see OBSERVABILITY_PLAN §3).
- PagerDuty escalation + on-call roster; status page linked in footer.

---

## 11. Future Improvements

- Distributed tracing (OpenTelemetry → Jaeger/Datadog APM).
- Anomaly detection on auth-failure + egress patterns.
- Log-based SIEM rules for security events.

---

## 12. Checklist

- [ ] Structured JSON logs + redaction on both services
- [ ] requestId/jobId correlation end-to-end
- [ ] `/metrics` exposed (internal); RED + USE dashboards
- [ ] Sentry wired (FE + BE)
- [ ] Security alerts: 5xx, auth-fail, decrypt-fail, 403 scan, queue stall
- [ ] Audit log append-only, 1-year retention
- [ ] SLO burn-rate alerts; status page live
- [ ] Synthetic `/health` checks from multiple regions

---

## 13. References

- [OBSERVABILITY_PLAN.md](OBSERVABILITY_PLAN.md) · [SECURITY_PLAN.md](SECURITY_PLAN.md) §12 · [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)
- Prometheus / Grafana / Sentry / OpenTelemetry docs
