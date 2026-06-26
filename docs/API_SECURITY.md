# 🔌 CodeVault — API Security

> Securing CodeVault's REST surface: the public-facing `web-backend` and `git-service` APIs (both under `/api/v1`) and their inter-service trust. Companion to [API_CONTRACT](API_CONTRACT.md) (the contract), [BACKEND_SECURITY](BACKEND_SECURITY.md), and [SECURITY_PLAN](SECURITY_PLAN.md) (§4, OWASP API Top 10).

---

## 1. Purpose

Ensure every endpoint is authenticated/authorized correctly, validated, rate-limited, idempotent where it mutates, and consistent in its response/error envelope — mapped to the **OWASP API Security Top 10 (2023)**.

---

## 2. Architecture

```
Browser ──user JWT──▶ web-backend /api/v1/*   (auth, users, platforms, stats, public, settings, github, notifications)
Browser ──user JWT──▶ git-service /api/v1/*    (sync, repos, problems)
both ──▶ shared envelopes: success = object | { items, nextCursor }; error = { error: { code, message, requestId } }
```

git-service is **not** trusted because it's "internal" — it verifies the same user JWT and re-checks ownership (Zero Trust).

---

## 3. Best Practices

- **Versioned routes** (`/api/v1`); breaking changes → `/v2`, never silent.
- **Consistent envelopes** + stable error codes (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `SESSION_EXPIRED`, `RATE_LIMITED`, `UPSTREAM_ERROR`, `INTERNAL`).
- **Cursor pagination** (`?cursor=&limit=`) — allowlisted query params only.
- **Idempotency** on mutations that retry (sync upsert on `(userId, platform, slug)`; per-connection lock).
- **Ownership from JWT**, never from the body.

---

## 4. Threats (OWASP API Top 10 mapped)

API1 BOLA · API2 Broken Auth · API3 Broken Object-Property-Level Auth (mass assignment) · API4 Unrestricted Resource Consumption · API5 BFLA · API6 Sensitive Business-Flow abuse (sync/scrape) · API7 **SSRF** · API8 Misconfiguration · API9 Improper Inventory · API10 Unsafe 3rd-party consumption.

---

## 5. Prevention Techniques

| Risk | Control |
|------|---------|
| BOLA | ownership filter from JWT on every object id |
| Broken auth | verify JWT on every protected route in **both** services |
| Mass assignment | `.strict()` DTOs; reject `role/plan/tokenStatus/userId` |
| Resource consumption | rate-limit + queue caps + timeouts + body limits |
| BFLA | `requireAdmin` for admin functions; default-deny |
| SSRF | username validation + outbound host allowlist |
| Unsafe upstream | treat platform/GitHub responses as untrusted; validate/sanitize |
| Enumeration | uniform `404` on `/public/:username`; rate-limit |

---

## 6. Implementation Guidelines

- Internal/system endpoints (if added) live on a private network, never public ingress.
- **API keys / HMAC** (future, for server-to-server or webhooks): sign with a shared secret, verify **HMAC + timestamp + nonce** to prevent replay (see [GITHUB_SECURITY](GITHUB_SECURITY.md) webhook verification).
- **Idempotency-Key** header support for client-initiated retries on POST `/sync`.
- Response validation: never echo secrets; public profile returns public-only fields.

---

## 7. Folder Structure

```
<service>/src/routes/index.ts     # mounts feature routers under /api/v1
<service>/src/middlewares/         # auth, validate, rateLimit
docs/API_CONTRACT.md               # the frozen contract (source of truth)
```

---

## 8. Recommended Libraries

`zod` (validation), `ioredis` (rate-limit + idempotency keys), `jsonwebtoken`, Node `crypto` (HMAC). Optional: an API gateway (Kong/Cloudflare API Shield) in front for centralized throttling + schema validation.

---

## 9. Configuration Examples

```ts
// Rate-limit + cooldown on a sensitive mutation
router.post('/', requireAuth,
  rateLimit({ windowSec: 900, max: 5, keyPrefix: 'sync-trigger' }),
  validateBody(triggerSyncSchema), handler);

// HMAC verification (future webhooks)
const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(`sha256=${expected}`))) throw new ForbiddenError();
```

---

## 10. Production Considerations

- Put **Cloudflare WAF / API Shield** in front for L7 rate-limiting and bot rules.
- Emit per-endpoint metrics (rate, latency p50/p95/p99, error rate) — see [MONITORING](MONITORING.md).
- Maintain an **API inventory**; retire unused/old versions (API9).
- Enforce request timeouts + max body size at the proxy and app.

---

## 11. Future Improvements

- OpenAPI spec generated from Zod schemas + contract-conformance tests in CI.
- Idempotency-Key middleware backed by Redis.
- Signed internal service-to-service calls (mTLS or HMAC) if a private backend mesh is added.

---

## 12. Checklist

- [ ] All routes under `/api/v1`; consistent success/error envelopes
- [ ] JWT verified in both services; ownership from token
- [ ] `.strict()` validation; mass-assignment blocked
- [ ] Rate limits + cooldowns + body/time limits
- [ ] Cursor pagination with allowlisted params
- [ ] Idempotent mutations; per-connection lock
- [ ] Uniform 404 on public lookups
- [ ] API inventory maintained; old versions retired

---

## 13. References

- [API_CONTRACT.md](API_CONTRACT.md) · [BACKEND_SECURITY.md](BACKEND_SECURITY.md) · [GITHUB_SECURITY.md](GITHUB_SECURITY.md) · [MONITORING.md](MONITORING.md)
- OWASP API Security Top 10 (2023)
