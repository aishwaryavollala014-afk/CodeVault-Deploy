# 📬 CodeVault — Queue & Background Jobs Security

> Securing CodeVault's asynchronous sync engine: **BullMQ** on Redis, consumed by `git-service` workers and scheduled by `node-cron`. Companion to [REDIS_SECURITY](REDIS_SECURITY.md), [GITHUB_SECURITY](GITHUB_SECURITY.md), and [PLATFORM_INTEGRATION](PLATFORM_INTEGRATION.md) (§6).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Run code-sync work off the request thread, safely and idempotently: never duplicate pushes, never run the same connection twice in parallel, retry transient failures with backoff, and surface session expiry instead of failing silently.

---

## 2. Architecture

```
node-cron (SYNC_CRON) ─▶ enqueueSync({userId, connectionId, trigger}) ─▶ BullMQ "sync" queue (Redis)
POST /api/v1/sync ──────▶ enqueueSync (manual)                          │
                                                                        ▼
                                  Worker (concurrency = SYNC_CONCURRENCY) ─▶ runSync()
                                     └─ lock:sync:{connectionId} (NX) → decrypt → diff → push → upsert → notify
```

Defined in `git-service/src/jobs/{queue,sync.job,scheduler}.ts` and `services/sync.service.ts`.

---

## 3. Best Practices

- **Job payloads carry IDs only** — never tokens/secrets. The worker decrypts in-memory at run time.
- **Per-connection distributed lock** (`lock:sync:{connectionId}`, `NX EX 1800`) — single-flight.
- **Idempotent work** — diff against `problems(userId, platform, slug)` before pushing; re-runs are no-ops.
- **Bounded concurrency** (`SYNC_CONCURRENCY`) + per-platform politeness to respect upstream rate limits.
- **Retry with exponential backoff** (`attempts: 3`, `backoff: exponential`).

---

## 4. Threats

Duplicate/parallel syncs → duplicate commits · poisoned job payloads · secret leakage in job data/logs · runaway retries hammering platforms/GitHub (cost + bans) · stuck/stalled jobs · queue backlog DoS · worker memory leaks.

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Duplicate/parallel | per-connection Redis lock + idempotent upsert |
| Poisoned payload | typed `SyncJobData`; producers are internal only |
| Secret leakage | IDs-only payloads; decrypt in-memory; redaction in logs |
| Runaway retries | capped `attempts`, exponential backoff, jitter |
| Stalled jobs | BullMQ stalled-job detection; auto-fail > threshold |
| Backlog DoS | per-user trigger cooldown (`rate-limit 5/15min`) + concurrency caps |
| Memory leaks | `removeOnComplete/removeOnFail` caps; worker resource limits |

---

## 6. Implementation Guidelines

- **Dead Letter Queue (DLQ):** failed jobs after max attempts → inspectable failed set (`removeOnFail: 200`); alert on growth.
- **Long-running jobs:** lock TTL (30 min) > worst-case sync; renew if needed.
- **Session expiry:** adapter throws `ExpiredSessionError` → mark connection `expired` + notify "Reconnect"; do not retry blindly.
- **Graceful shutdown:** let in-flight jobs finish; lock auto-expires if the worker dies.

---

## 7. Folder Structure

```
git-service/src/jobs/
├── queue.ts        # BullMQ Queue + enqueueSync (attempts, backoff)
├── sync.job.ts     # Worker (concurrency, failed/completed handlers)
└── scheduler.ts    # node-cron → enqueue per active connection
git-service/src/services/sync.service.ts   # runSync: lock, diff, push, expiry
```

---

## 8. Recommended Libraries

`bullmq`, `node-cron`, `ioredis` (durable queue instance, `appendonly yes`, `noeviction`).

---

## 9. Configuration Examples

```ts
syncQueue.add('sync', data, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 200,
});
new Worker('sync', processor, { connection: bullConnection, concurrency: env.SYNC_CONCURRENCY });
```

```env
SYNC_CRON=0 */6 * * *
SYNC_CONCURRENCY=3
```

---

## 10. Production Considerations

- Workers run with **no public ingress**; scale on **queue depth**.
- Per-platform concurrency caps (e.g. max 3 LeetCode workers) to avoid throttling/bans.
- **Kill switch** (`SYNC_ENABLED=false`) to pause all sync during an incident.
- Monitor queue depth, wait time, failed/stalled counts, job duration (see [MONITORING](MONITORING.md)).

---

## 11. Future Improvements

- Explicit DLQ with replay tooling.
- Pre-expiry token notifications (warn before sessions die).
- Priority lanes (manual triggers ahead of scheduled).
- Per-platform rate-limiter token bucket shared across workers.

---

## 12. Checklist

- [x] Job payloads carry IDs only; secrets decrypted in-memory
- [x] Per-connection lock (NX EX); idempotent upsert
- [x] Bounded concurrency + per-platform caps *(global cap + best-effort per-platform Redis semaphore)*
- [x] Retry attempts capped with exponential backoff *(jitter not explicit)*
- [x] Expired session → mark + notify, no blind retry
- [ ] Stalled-job detection; DLQ/failed-set alerts *(failed-set retained; alerting deploy-time)*
- [x] Kill switch to pause sync *(`SYNC_ENABLED` env flag)*
- [ ] Queue depth + failure monitoring *(deploy-time)*

---

## 13. References

- [REDIS_SECURITY.md](REDIS_SECURITY.md) · [GITHUB_SECURITY.md](GITHUB_SECURITY.md) · [PLATFORM_INTEGRATION.md](PLATFORM_INTEGRATION.md) §6 · [MONITORING.md](MONITORING.md)
- BullMQ docs (rate limiting, stalled jobs, flows)


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
