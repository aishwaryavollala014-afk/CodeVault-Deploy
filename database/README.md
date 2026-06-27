# 🗄️ CodeVault — Database (`database/`)

Raw SQL artifacts for the CodeVault PostgreSQL database. The **tables/enums/indexes/constraints** are owned by Prisma (`web-backend/prisma/`); the files here add the DBMS features Prisma can't express and serve as the canonical SQL reference. See the concept map in [`../docs/DBMS_CONCEPTS.md`](../docs/DBMS_CONCEPTS.md) and the design in [`../docs/DATABASE_PLAN.md`](../docs/DATABASE_PLAN.md).

## Files
| File | What | Applied? |
|------|------|----------|
| [schema.sql](schema.sql) | **Full generated DDL** (pg_dump): 12 enums, 11 tables, PK/FK, CHECK constraints, all indexes | ✅ (it *is* the live schema) |
| [views_triggers_functions.sql](views_triggers_functions.sql) | `set_updated_at()` + triggers, `refresh_solved_count()`, 4 analytics **views** | ✅ applied to dev |
| [rls.sql](rls.sql) | **Row-Level Security** policies (owner isolation) | ⏸ ready (enable with cv_web/cv_git + GUC) |
| [partitioning.sql](partitioning.sql) | Range/hash **partitioning** patterns | ⏸ reference (apply at scale) |
| [queries.sql](queries.sql) | Example **DQL/DML/TCL/DCL** (joins, aggregates, windows, CTEs, upsert, transactions) | 📖 reference |
| [`../web-backend/prisma/sql/roles.sql`](../web-backend/prisma/sql/roles.sql) | Per-service least-privilege **roles + grants** (DCL) | ✅ roles created in dev |

## Apply (dev)
```bash
docker exec -i codevault-postgres psql -U codevault -d codevault < database/views_triggers_functions.sql
docker exec -i codevault-postgres psql -U codevault -d codevault < web-backend/prisma/sql/roles.sql
# rls.sql / partitioning.sql — only when wiring least-priv roles / scaling
```

## Regenerate the schema dump
```bash
docker exec codevault-postgres pg_dump -U codevault -d codevault \
  --schema-only --no-owner --no-privileges > database/schema.sql
```

## ⚠️ Prisma + raw SQL note
Prisma manages tables/enums/indexes. The **partial unread index** and **GIN topics index** + **CHECK constraints** were added via a Prisma migration (`security_constraints`); views/triggers/functions/RLS live here **outside** Prisma. Because Prisma can't model these, `prisma migrate dev` may report them as "drift" and offer to drop them — **decline**, or apply changes via `prisma migrate diff`/manual SQL. Never let `migrate dev` reset in an environment with these objects.
