# 🗄️ CodeVault — Database Security

> Production database-security guide for CodeVault's PostgreSQL + Prisma data layer. Companion to [DATABASE_PLAN](DATABASE_PLAN.md) (schema) and [SECURITY_PLAN](SECURITY_PLAN.md) (§5 Database Security). Scope: the single managed Postgres instance shared by `web-backend` (owner of most tables) and `git-service` (writes `problems` + `sync_runs` only).

---

## 1. Purpose

Protect the **crown-jewel data** CodeVault stores: envelope-encrypted platform/GitHub tokens, user PII (email), and the high-volume `problems`/`sync_runs` tables. A single unauthorized read or a leaked backup must **not** expose third-party credentials. This document defines how the database is structured, accessed, encrypted, backed up, and monitored.

---

## 2. Architecture

```
web-backend ─(role: cv_web, write users/connections/secrets/...) ─┐
                                                                   ├─▶ PostgreSQL 16 (managed, HA)
git-service ─(role: cv_git, write problems/sync_runs; read rest) ─┘        │
                                                                  ├─ PITR + encrypted backups
analytics  ─(role: cv_read, NO access to secret tables) ──────────┘        └─ read replica (stats/public reads)
```

- **One primary DB, per-table ownership** (not two databases) — avoids dual-write drift. Enforced by **separate Postgres roles**, not app convention.
- **cuid primary keys** (opaque, non-enumerable) per [API_CONTRACT](API_CONTRACT.md) — anti-IDOR/enumeration. (DATABASE_PLAN originally proposed UUIDv7; CodeVault standardized on `@default(cuid())` in Prisma.)
- Connection via Prisma client (`lib/prisma.ts`) — one shared pooled client per service.

---

## 3. Best Practices

| Area | CodeVault practice |
|------|--------------------|
| **Primary keys** | `@default(cuid())` — non-sequential, non-guessable |
| **Normalization** | 3NF baseline; documented denormalization (`connections.solvedCount`, `githubRepos.fileCount`, `stats_snapshots`) |
| **Foreign keys** | All owner FKs `onDelete: Cascade`; `audit_logs.userId` `SetNull` (retain trail) |
| **Constraints** | Unique `(userId, platform)`, `(userId, platform, slug)`; check `solvedCount >= 0`; enums for closed sets |
| **Indexing** | `(userId)` everywhere (the #1 access pattern), `(userId, platform, slug)` for idempotent upsert, partial index on `notifications(userId) WHERE readAt IS NULL` |
| **Soft deletes** | `users.deletedAt`, `connections.deletedAt` (GDPR-safe); secrets are **hard-purged** |
| **Audit tables** | Append-only `audit_logs`; revoke `UPDATE/DELETE` from app roles |

---

## 4. Threats

- **DB read → mass external account takeover** (the #1 risk: stored platform/GitHub tokens).
- **SQL injection** via raw queries.
- **IDOR / BOLA** through enumerable IDs or missing `userId` filters.
- **Backup theft** exposing plaintext secrets.
- **Privilege creep** — a compromised service writing tables it shouldn't.
- **Slow-query DoS** and unbounded result sets.

---

## 5. Prevention Techniques

- **Envelope encryption (app-layer)** of `oauth_identities.accessTokenCipher` and `connection_secrets.tokenCipher` — AES-256-GCM, key in env (KMS in prod), `keyVersion` for rotation. Plaintext tokens **never** touch the DB.
- **Encryption at rest** (managed-DB/disk) **+** the app-layer column encryption above (defense in depth).
- **Encryption in transit:** TLS `verify-full` to Postgres and Redis.
- **Password hashing:** N/A (OAuth-only, no passwords). Refresh tokens stored **SHA-256 hashed**, never plaintext.
- **Parameterized queries only:** Prisma parameterizes by default; **forbid** string-interpolated `$queryRawUnsafe`. Lint/review gate on any `queryRaw`.
- **Ownership filter** on every query (`where: { userId }`) — never trust client IDs.
- **Row-Level Security (optional hardening):** enable RLS so every row read is forced through `user_id = current_app_user`.

---

## 6. Implementation Guidelines

- Single Prisma client per service (`src/lib/prisma.ts`); reuse across hot-reloads in dev.
- All token read/write goes through `lib/crypto.ts` (`encrypt`/`decrypt`); git-service decrypts in-memory only and never logs.
- Migrations: **web-backend owns all migrations**; git-service runs `prisma generate` only (schema mirrored).
- Apply **expand → migrate → contract** for breaking changes (add nullable → backfill → enforce → drop) for zero-downtime.
- Cursor (keyset) pagination on `problems`, `sync_runs`, `notifications` — never `OFFSET` at depth.

---

## 7. Folder Structure

```
web-backend/prisma/
├── schema.prisma          # 11 tables, enums, indexes (source of truth)
└── migrations/            # ordered, immutable, committed
web-backend/src/lib/
├── prisma.ts              # shared pooled client
└── crypto.ts              # AES-256-GCM envelope encryption
git-service/prisma/
└── schema.prisma          # mirror (generate-only, NO migrations)
```

---

## 8. Recommended Libraries

`@prisma/client`, `prisma` (migrations), Node `crypto` (AES-256-GCM, no extra dep), `pg`/PgBouncer or **Prisma Accelerate** for pooling, `pino` for query/slow-query logging.

---

## 9. Configuration Examples

```env
# Per-service least-privilege roles (prod)
DATABASE_URL=postgresql://cv_web:***@db.internal:5432/codevault?sslmode=verify-full
# git-service:
DATABASE_URL=postgresql://cv_git:***@db.internal:5432/codevault?sslmode=verify-full
```

```sql
-- Least-privilege roles (run once, by a migration/bootstrap admin)
CREATE ROLE cv_git LOGIN PASSWORD '***';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cv_git;
GRANT INSERT, UPDATE ON problems, sync_runs, notifications TO cv_git;
REVOKE UPDATE, DELETE ON audit_logs FROM cv_git, cv_web;  -- append-only
```

---

## 10. Production Considerations

- **Connection pooling:** PgBouncer (transaction mode) or Prisma Accelerate in serverless edges; cap pool per replica.
- **Read replicas:** route `/stats` + `/public/:username` reads to a replica; a restricted `cv_read` role with **no access to secret tables**.
- **Transactions + optimistic locking:** sync upserts run in transactions; idempotency via unique `(userId, platform, slug)`.
- **Partitioning (threshold-triggered):** range-partition `sync_runs`/`audit_logs`/`notifications` by month; hash-partition `problems` by `userId` past ~100M rows.
- **Backups:** automated encrypted backups + **PITR**; backups contain **ciphertext only** (keys live separately in KMS).
- **Disaster recovery:** quarterly **restore drills**; RPO ≤ 15 min, RTO ≤ 1 hr.
- **Monitoring:** slow-query log, index-usage review, replication lag, connection saturation, **token-decrypt failure alerts**.

---

## 11. Future Improvements

- Enable RLS across all owned tables.
- Move master key to managed KMS with automatic rotation (`keyVersion` already supports it).
- Add a `change_history` table if settings/versioning auditing is needed.
- Automated restore-verification job (restore to scratch instance + checksum).

---

## 12. Checklist

- [ ] All tokens envelope-encrypted (AES-256-GCM); plaintext never stored
- [ ] Refresh tokens stored hashed (SHA-256)
- [ ] TLS `verify-full` to Postgres + Redis
- [ ] Per-service least-privilege roles; `audit_logs` append-only
- [ ] Every query owner-scoped (`userId`); no `queryRawUnsafe`
- [ ] cuid PKs; unique + check constraints in place
- [ ] Cursor pagination on high-volume tables
- [ ] Encrypted backups + PITR + tested restore drill
- [ ] Slow-query + replication-lag + decrypt-failure monitoring
- [ ] Migrations: expand→migrate→contract; reversible

---

## 13. References

- [DATABASE_PLAN.md](DATABASE_PLAN.md) · [SECURITY_PLAN.md](SECURITY_PLAN.md) · [SECRETS.md](SECRETS.md) · [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)
- PostgreSQL docs: Roles & Privileges, Row Security Policies · Prisma docs: Connection management, Accelerate · OWASP: SQL Injection Prevention Cheat Sheet
