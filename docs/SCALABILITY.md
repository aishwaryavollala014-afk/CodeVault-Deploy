# 📈 CodeVault — Performance & Scalability

> How CodeVault scales from a few users to millions, and the performance controls that keep it fast and cheap. Companion to [INFRASTRUCTURE_SECURITY](INFRASTRUCTURE_SECURITY.md), [DATABASE_SECURITY](DATABASE_SECURITY.md), and [REDIS_SECURITY](REDIS_SECURITY.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Keep CodeVault responsive under load: stateless services scaling horizontally, read-heavy stats served from cache/replicas, and the expensive sync path isolated behind a queue with strict caps.

---

## 2. Architecture

```
CDN/edge (static + public profile ISR)
   │
LB → web-backend (N stateless, JWT + Redis) → Postgres primary + read replicas
LB → git-service API (N stateless)            → Redis (cache + queue + locks)
       git-service workers (M, scale on queue depth)
```

All three services are **stateless** (JWT auth + Redis shared state) → scale out freely.

---

## 3. Best Practices

- **Stateless services** — no in-memory sessions; horizontal scale behind an LB.
- **Cache read-heavy paths** — `/stats` (10 min), `/public/:username` (15 min) + `stats_snapshots` durable fallback.
- **Queue the expensive path** — sync never runs on a request thread.
- **Cursor pagination** everywhere — stable + fast at depth.
- **Lean hot tables** — code lives in GitHub, not the DB.

---

## 4. Threats to Performance

Cache-miss storms on `/stats` · N+1 queries · unbounded result sets · sync flood exhausting upstream/GitHub limits · DB connection saturation · worker memory leaks · cold serverless starts.

---

## 5. Prevention / Techniques

| Concern | Technique |
|---------|-----------|
| Cache stampede | snapshot fallback; (future) probabilistic early expiry |
| N+1 | batched repository reads; Prisma `select`/`include` discipline |
| Unbounded reads | cursor pagination + `take` caps |
| Sync flood | per-user cooldown + queue concurrency caps + per-platform limits |
| DB saturation | PgBouncer/Accelerate pooling; read replicas for reads |
| Worker leaks | `removeOnComplete/Fail` caps; container memory limits |
| Cold starts | keep backends as long-running containers (not per-request lambdas) |

---

## 6. Implementation Guidelines

- Route `/stats` + `/public` reads to a **read replica**; writes to primary.
- Dynamic-import heavy FE islands (charts/heatmap) to cut bundle (see [FRONTEND_PLAN](FRONTEND_PLAN.md) §11).
- Compression (gzip/br) at the proxy; HTTP caching headers for static.
- **Circuit breakers + retries with jitter** around platform/GitHub calls; serve last snapshot when upstream is down.

---

## 7. Folder Structure

```
web-backend/src/services/stats.service.ts    # cache + snapshot fallback
web-backend/src/lib/redis.ts                  # cache + rate-limit
git-service/src/jobs/                          # queue + workers (scale unit)
```

---

## 8. Recommended Tools

PgBouncer / Prisma Accelerate (pooling), managed Postgres read replicas, managed Redis (HA), Cloudflare/Vercel CDN, k6 (load testing), autoscalers (CPU/RPS + queue depth).

---

## 9. Configuration Examples

```ts
// React Query stale times mirror server cache
useQuery({ queryKey: ['stats'], staleTime: 10 * 60 * 1000 });
```
```
# autoscaling (conceptual)
web-backend: target CPU 60% / RPS
git-service-workers: target queue_depth < 50
```

---

## 10. Production Considerations

- **Scale path:** vertical → read replicas → partition `problems`/`sync_runs`/`audit_logs` → shard `problems` by `hash(userId)` past ~100M rows.
- Cap worker concurrency + per-user quotas to bound upstream cost.
- Define SLOs + load-test targets (k6): `/stats` p95 ≤ 800ms @ 50 users; `/public` p95 ≤ 300ms @ 200 users (see [TESTING_PLAN](TESTING_PLAN.md) §3.6).

---

## 11. Future Improvements

- Edge caching of public profiles with stale-while-revalidate.
- Per-platform shared token-bucket limiter across workers.
- Materialized aggregates for heavy analytics.

---

## 12. Checklist

- [ ] All services stateless; horizontal scaling verified
- [ ] `/stats` + `/public` cached + replica-served
- [ ] Sync queued; concurrency + per-user cooldown caps
- [ ] Cursor pagination + `take` caps everywhere
- [ ] Pooling (PgBouncer/Accelerate); replicas for reads
- [ ] Circuit breakers + retry/jitter on upstreams; snapshot fallback
- [ ] Partition/shard plan threshold-armed
- [ ] Load tests meet SLO targets

---

## 13. References

- [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md) · [DATABASE_SECURITY.md](DATABASE_SECURITY.md) · [REDIS_SECURITY.md](REDIS_SECURITY.md) · [TESTING_PLAN.md](TESTING_PLAN.md)
- DATABASE_PLAN §12 (Future Scalability) · DEVOPS_PLAN §6 (Scaling)


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
