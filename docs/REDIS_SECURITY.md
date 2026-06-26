# 🧠 CodeVault — Redis & Caching Security

> Securing CodeVault's Redis layer, which serves three jobs: **cache** (stats, public profiles), **rate-limiting**, and the **BullMQ queue + distributed locks** for git-service. Companion to [QUEUE_SECURITY](QUEUE_SECURITY.md), [SCALABILITY](SCALABILITY.md), and [SECRETS](SECRETS.md).

---

## 1. Purpose

Keep Redis fast and safe: authenticated, network-isolated, encrypted in transit, with sane TTLs and invalidation so cached data never goes stale or leaks across users.

---

## 2. Architecture

```
web-backend ──▶ Redis ── stats:{userId}:{platform} (TTL 10m), public:{handle} (TTL 15m), rl:{prefix}:{id}
git-service ──▶ Redis ── BullMQ "sync" queue, lock:sync:{connectionId} (TTL 30m), rl:sync-trigger:{userId}
```

Single managed Redis (dev: Docker on host `6380`). BullMQ uses a connection with `maxRetriesPerRequest: null`.

---

## 3. Best Practices

- **Namespaced keys** (`stats:`, `public:`, `rl:`, `lock:sync:`) — predictable, scoped, easy to invalidate.
- **TTL on everything cached** — no unbounded keys.
- **Cache only non-sensitive data** — never store tokens, PII, or decrypted secrets in Redis.
- **Fail open** for cache/rate-limit (availability > strictness); **fail closed** for locks (correctness).
- **Idempotent locks** (`SET key val NX EX ttl`) for single-flight sync.

---

## 4. Threats

Unauthenticated Redis exposed to the internet · plaintext traffic sniffing · cache poisoning · stale/cross-user cache leakage · memory exhaustion (eviction of locks/queue) · queue payload tampering.

---

## 5. Prevention Techniques

| Threat | Control |
|--------|---------|
| Open Redis | private subnet, no public ingress, firewall to app SGs only |
| Auth | `requirepass` / **Redis ACL** users per service (least privilege) |
| Sniffing | **TLS** in prod (`rediss://`), `verify-full` |
| Cache poisoning | only the server writes cache keys; values are server-derived |
| Cross-user leak | keys include `userId`/`handle`; never share a key across users |
| Memory pressure | `maxmemory` + `allkeys-lru` for cache DB; **separate DB/instance for queue+locks** so eviction can't drop jobs |
| Payload tampering | queue payloads carry **IDs only**, never secrets |

---

## 6. Implementation Guidelines

- Rate-limit keys: `rl:{prefix}:{userId|ip}` via `INCR` + `EXPIRE`.
- Cache keys: write-through on miss, TTL set atomically.
- Locks: `redis.set(lock:sync:{id}, '1', 'EX', 1800, 'NX')`; release in `finally`.
- **Cache invalidation:** on connect/disconnect → drop `stats:{userId}:*`; on settings change → drop `public:{handle}`.

---

## 7. Folder Structure

```
web-backend/src/lib/redis.ts        # shared client (cache + rate-limit)
web-backend/src/services/stats.service.ts    # stats: cache + snapshot fallback
web-backend/src/services/public.service.ts   # public: cache
git-service/src/lib/redis.ts        # client + bullConnection
git-service/src/jobs/queue.ts       # BullMQ queue
git-service/src/services/sync.service.ts      # lock:sync:{connectionId}
```

---

## 8. Recommended Libraries

`ioredis` (client), `bullmq` (queue), managed Redis (Upstash/ElastiCache) with ACL + TLS.

---

## 9. Configuration Examples

```env
REDIS_URL=rediss://default:***@redis.internal:6380   # TLS in prod
```

```
# redis.conf (managed equivalents)
requirepass <strong>
maxmemory 512mb
maxmemory-policy allkeys-lru   # cache instance only
# queue/lock instance: noeviction
```

---

## 10. Production Considerations

- **Separate cache vs queue/lock** (different DB index or instance) so LRU eviction never drops a job or a lock.
- HA Redis (replica + failover); the queue/lock instance should be durable (`appendonly yes`).
- Monitor hit rate, memory, eviction, command latency (see [MONITORING](MONITORING.md)).
- Cache stampede protection: snapshot fallback (`stats_snapshots`) already absorbs upstream failures.

---

## 11. Future Improvements

- Per-service Redis ACL users with command allowlists.
- Cache versioning (`v2:stats:...`) for safe schema changes.
- Probabilistic early expiration to prevent stampedes.

---

## 12. Checklist

- [ ] Redis on private network, no public ingress
- [ ] AUTH/ACL enabled; TLS (`rediss://`) in prod
- [ ] All cache keys namespaced + TTL'd; include userId/handle
- [ ] No tokens/PII/secrets in Redis; queue payloads carry IDs only
- [ ] Cache vs queue/lock isolated; queue durable, no eviction
- [ ] Locks use `NX EX`; released in `finally`
- [ ] Invalidation wired to connect/disconnect/settings changes
- [ ] Memory + hit-rate + eviction monitoring

---

## 13. References

- [QUEUE_SECURITY.md](QUEUE_SECURITY.md) · [SCALABILITY.md](SCALABILITY.md) · [MONITORING.md](MONITORING.md) · [SECRETS.md](SECRETS.md)
- Redis ACL / TLS docs · BullMQ connection guide
