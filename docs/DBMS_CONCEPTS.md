# 🧮 CodeVault — DBMS Concepts Map

> Every core DBMS topic and exactly how it's realized in CodeVault's PostgreSQL + Prisma data layer. Each row points to the concrete artifact. Companion to [DATABASE_PLAN](DATABASE_PLAN.md), [DATABASE_SECURITY](DATABASE_SECURITY.md), and the SQL in [`../database/`](../database/).

---

> 🧭 **Where this fits:** part of the [CodeVault docs set](README.md). For *what's actually built today* — live feature status, owners, and known gaps — see **[FEATURES.md](FEATURES.md)**. The sections below describe the intended design; the shipped code may not yet fully match.

## 1. Data Model & Schema
| Concept | In CodeVault |
|--------|--------------|
| **ER / relational model** | 11 entities (User, OAuthIdentity, Connection, ConnectionSecret, GithubRepo, Problem, SyncRun, StatsSnapshot, Notification, AuthSession, AuditLog) — ERD in [DATABASE_PLAN §6](DATABASE_PLAN.md) |
| **Schema definition (DDL)** | [`database/schema.sql`](../database/schema.sql) (full pg_dump) + [`web-backend/prisma/schema.prisma`](../web-backend/prisma/schema.prisma) |
| **Domains / enums** | 12 native PG enums (`PlatformType`, `SyncStatus`, …) |

## 2. Keys & Relationships
| Concept | In CodeVault |
|--------|--------------|
| **Primary keys** | `cuid` surrogate PKs on every table (non-enumerable) |
| **Candidate / unique keys** | `users.handle`, `users.githubLogin`, `(userId,platform)`, `(userId,platform,slug)`, `auth_sessions.refreshTokenHash`, … |
| **Foreign keys** | 12 FKs; `ON DELETE CASCADE` for owned data, `SET NULL` for `audit_logs.userId` |
| **1:1 / 1:M / M:N** | 1:1 Connection↔ConnectionSecret; 1:M User↔*; topics modeled as `text[]` (no junction yet) |

## 3. Normalization
| Concept | In CodeVault |
|--------|--------------|
| **3NF baseline** | All tables in 3NF |
| **Documented denormalization** | `connections.solvedCount`, `github_repos.fileCount`, `stats_snapshots` (read perf) — refreshed on sync |

## 4. Integrity Constraints
| Concept | In CodeVault |
|--------|--------------|
| **Entity integrity** | NOT NULL + PKs |
| **Referential integrity** | FKs + cascade rules |
| **Domain integrity** | enums + types (`Bytes`, `Json`, `timestamptz`) |
| **CHECK constraints** | `chk_solved_count_nonneg`, `chk_file_count_nonneg`, `chk_items_pushed_le_fetched` (migration `security_constraints`) |
| **Unique constraints** | see Keys above |

## 5. SQL Sub-languages
| Concept | In CodeVault |
|--------|--------------|
| **DDL** | `database/schema.sql`, Prisma migrations |
| **DML** | Prisma queries (create/update/upsert/delete); examples in [`database/queries.sql`](../database/queries.sql) |
| **DQL** | joins, aggregates, subqueries, window functions, CTEs, set ops — [`database/queries.sql`](../database/queries.sql) |
| **TCL** | transactions (`prisma.$transaction`), isolation levels, savepoints — queries.sql |
| **DCL** | `GRANT`/`REVOKE` per-service roles — [`web-backend/prisma/sql/roles.sql`](../web-backend/prisma/sql/roles.sql) |

## 6. Views
`v_user_dashboard`, `v_platform_leaderboard` (window rank), `v_sync_health` (DISTINCT ON), `v_unread_notifications` — [`database/views_triggers_functions.sql`](../database/views_triggers_functions.sql).

## 7. Stored Functions & Triggers
| Concept | In CodeVault |
|--------|--------------|
| **PL/pgSQL functions** | `set_updated_at()`, `refresh_solved_count()`, `app_current_user_id()` |
| **Triggers** | `trg_*_updated` BEFORE UPDATE on 6 tables (auto-touch `updatedAt`) |

## 8. Indexing & Query Optimization
| Concept | In CodeVault |
|--------|--------------|
| **B-tree** | every `(userId)` + unique composite indexes |
| **Partial index** | `idx_notifications_unread … WHERE "readAt" IS NULL` (unread hot path) |
| **GIN index** | `idx_problems_topics_gin` on `topics text[]` |
| **Cursor (keyset) pagination** | notifications, sync activity, repo files, `/stats/recent` |
| **Plan inspection** | `EXPLAIN ANALYZE` examples in queries.sql |

## 9. Transactions & Concurrency (ACID)
| Concept | In CodeVault |
|--------|--------------|
| **Atomicity** | `prisma.$transaction([...])` (authorize-sync, account-delete purge) |
| **Isolation** | PG default Read Committed; `BEGIN ISOLATION LEVEL …` shown in queries.sql |
| **Idempotency / locking** | unique `(userId,platform,slug)` upsert + per-connection Redis advisory lock (`lock:sync:*`) |
| **Optimistic concurrency** | `@updatedAt` + unique constraints |

## 10. Security
| Concept | In CodeVault |
|--------|--------------|
| **Least-privilege roles** | `cv_web`, `cv_git`, `cv_read` ([roles.sql](../web-backend/prisma/sql/roles.sql)) |
| **Row-Level Security** | owner-isolation policies ([rls.sql](../database/rls.sql)) |
| **Encryption** | envelope-encrypted tokens (`bytea`), refresh hashed; see [DATABASE_SECURITY](DATABASE_SECURITY.md) |
| **Append-only audit** | `audit_logs` with `UPDATE/DELETE` revoked from app roles |

## 11. Scalability & Recovery
| Concept | In CodeVault |
|--------|--------------|
| **Partitioning** | range (by month) + hash (by userId) patterns — [partitioning.sql](../database/partitioning.sql) |
| **Read replicas** | planned for `/stats` + `/public` reads (DATABASE_PLAN §12) |
| **Backup / PITR / DR** | [DISASTER_RECOVERY](DISASTER_RECOVERY.md) (deploy-time) |
| **Migrations** | versioned, immutable Prisma migrations; expand→migrate→contract |

---

## How to explore
```bash
# full schema
less database/schema.sql
# apply views/triggers/functions
docker exec -i codevault-postgres psql -U codevault -d codevault < database/views_triggers_functions.sql
# run the showcase queries
docker exec -i codevault-postgres psql -U codevault -d codevault -f - < database/queries.sql
```

> Status: schema, constraints, indexes, views, triggers, functions, and roles are **implemented + applied** to the dev DB. RLS + partitioning are **ready scripts** to enable at the appropriate stage (see notes in each file).


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [ ] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
