# 🛡️ CodeVault — Backend Security

> Security guide for CodeVault's two Express/TypeScript services — `web-backend` (auth, stats, profiles) and `git-service` (GitHub sync). Companion to [SECURITY_PLAN](SECURITY_PLAN.md) (§7), [BACKEND_PLAN](BACKEND_PLAN.md), and [API_SECURITY](API_SECURITY.md).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Purpose

Harden the request path of both Express services so every request is authenticated where required, validated at the edge, ownership-scoped, rate-limited, and failed safely — without leaking secrets or stack traces.

---

## 2. Architecture

```
request → requestId → pino-http log → helmet → CORS allowlist → json(1mb) → cookieParser
        → [route] → requireAuth (JWT) → validate (Zod) → controller → service → repository/integration
        → response envelope → notFound → errorHandler (typed → safe JSON)
```

Layering is strict (BACKEND_PLAN §1.3): **Route → Controller → Service → Repository/Integration**. Controllers never touch the DB; only services orchestrate.

---

## 3. Best Practices

- **Helmet** on every response; `x-powered-by` disabled.
- **Zod validation** at the edge via `validate.middleware.ts`; `.strict()` schemas reject unknown fields.
- **CORS** restricted to `CORS_ORIGIN` (frontend), `credentials: true` — never `*` with credentials.
- **Body size limit** `1mb`; JSON only.
- **Typed error hierarchy** (`utils/errors.ts`) → one central `errorHandler` → `{ error: { code, message, requestId } }`.
- **Request IDs** on every request + log line + error body (correlation).
- **Graceful shutdown:** drain in-flight requests, close Prisma + Redis on SIGINT/SIGTERM.

---

## 4. Threats

XSS (stored, from platform content) · SQL injection · CSRF on cookie-auth mutations · SSRF via username → platform fetch · path traversal in sync file paths · prototype pollution via untrusted JSON · mass assignment (`role`/`plan`) · unrestricted resource consumption (sync flood) · verbose errors leaking internals.

---

## 5. Prevention Techniques

| Threat | Control in CodeVault |
|--------|----------------------|
| XSS | React escaping (FE); sanitize platform-sourced HTML before storing in `question.md`; `CodeBlock` renders as text |
| SQL injection | Prisma parameterization; no `queryRawUnsafe` |
| CSRF | httpOnly + `SameSite=Lax` cookies + OAuth `state`; anti-CSRF token on mutations (FE) |
| SSRF | strict username regex (`platform.validator.ts`); platform hosts hard-coded; egress allowlist (git-service) |
| Path traversal | `padNumber`/`slugify` sanitize folder/file names; never use raw platform strings as paths |
| Prototype pollution | Zod `.strict()` parsing; no recursive merge of untrusted objects |
| Mass assignment | `.strict()` DTOs; `role/plan/userId/tokenStatus` server-controlled only |
| Resource exhaustion | Redis rate-limit + BullMQ concurrency caps + per-connection cooldown |
| Error leakage | central handler; generic 5xx in prod; no stack traces to clients |

---

## 6. Implementation Guidelines

- One middleware order in `app.ts`; never reorder auth after routes.
- `requireAuth` derives `req.user.id` **only** from the verified JWT.
- Every service method that touches user data filters by `userId`.
- Wrap async handlers in `asyncHandler` so rejections reach `errorHandler`.
- Sanitize all upstream platform/GitHub content before storing or returning.

---

## 7. Folder Structure

```
<service>/src/
├── app.ts                 # middleware chain assembly
├── server.ts              # listen + graceful shutdown
├── middlewares/           # requestId, auth, validate, rateLimit, error
├── controllers/           # HTTP I/O only
├── services/              # business logic + integrations
├── validators/            # Zod schemas (.strict)
├── lib/                   # prisma, redis, logger, crypto, httpClient, jwt
└── utils/errors.ts        # typed error hierarchy
```

---

## 8. Recommended Libraries

`express`, `helmet`, `cors`, `cookie-parser`, `zod`, `pino` + `pino-http`, `jsonwebtoken`, `ioredis` (rate-limit), `axios` (egress). Avoid heavy frameworks; keep the dependency surface small.

---

## 9. Configuration Examples

```ts
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
// rate limit a sensitive route
router.post('/', rateLimit({ windowSec: 900, max: 5, keyPrefix: 'sync-trigger' }), handler);
```

---

## 10. Production Considerations

- TLS terminated at Cloudflare/LB; HSTS; secure cookies.
- Per-IP **and** per-user rate limits (stricter on auth, public profile, sync trigger).
- Structured JSON logs to a sink with **redaction** (no tokens/PII).
- Health (`/health`) + readiness (`/ready`) probes gate traffic.
- Request timeouts at the proxy; body/time limits at the app.

---

## 11. Future Improvements

- API versioning beyond `/api/v1` with deprecation policy.
- CSP nonces wired from backend to frontend.
- Centralized schema registry for shared DTOs.
- Add `express-rate-limit`-style sliding window if fixed-window proves too coarse.

---

## 12. Checklist

- [x] Helmet + strict CORS + 1mb body limit on both services
- [x] Zod `.strict()` on every input; unknown fields rejected
- [x] `requireAuth` + ownership filter on every protected route
- [x] SSRF: username validated, platform hosts hard-coded, egress allowlist
- [x] Central error handler; no stack traces in prod
- [x] Rate limits on auth/public/sync; queue concurrency caps
- [x] requestId correlation end-to-end
- [x] Graceful shutdown drains DB/Redis

---

## 13. References

- [SECURITY_PLAN.md](SECURITY_PLAN.md) · [API_SECURITY.md](API_SECURITY.md) · [AUTH_SECURITY.md](AUTH_SECURITY.md) · [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md)
- OWASP API Security Top 10 (2023) · Express security best practices · Helmet docs


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [ ] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
