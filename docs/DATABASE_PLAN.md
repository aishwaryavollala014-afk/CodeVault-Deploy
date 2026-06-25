# 🗄️ CodeVault — Production Database Blueprint

> Senior Database Architect design. **No SQL, no backend code** — table dictionaries, ERD, constraints, indexing, and strategy only. Engine: **PostgreSQL** (managed). ORM in app layer: Prisma (migrations only). Companion to [BACKEND_PLAN](BACKEND_PLAN.md) & [SECURITY_PLAN](SECURITY_PLAN.md).

---

## 1. Requirement Analysis

### 1.1 Core business entities
User · OAuth identity (GitHub) · Connection (platform link) · Connection secret (encrypted sync token) · GitHub repo mapping · Problem (synced) · Sync run · Stats snapshot (cached Path A) · Notification · Auth session (refresh) · Audit log.

### 1.2 Relationships (summary)
A **User** has many **Connections** (one per platform), each with at most one **ConnectionSecret**; a User has one or more **OAuthIdentities**, many **GithubRepos**, **Problems**, **SyncRuns**, **StatsSnapshots**, **Notifications**, **AuthSessions**, **AuditLogs**.

### 1.3 User roles & data ownership
- Roles: `user` (default), `admin` (internal, read-mostly). No teams/orgs → no multi-tenant hierarchy yet.
- **Service ownership (writes):** `web-backend` owns users/oauth/connections/secrets/github_repos/stats_snapshots; `git-service` owns problems/sync_runs; both append notifications/audit_logs. (Enforced by per-service DB roles — §10.)
- **Row ownership:** every domain row carries `user_id`; access is always scoped to the owner.

### 1.4 Business rules (DB-enforced where possible)
- One connection per (user, platform). One repo mapping per (user, platform). A problem is unique per (user, platform, slug) → idempotent re-sync.
- Code sync requires an authorized `ConnectionSecret`; without it `sync_enabled = false`.
- Session tokens expire → `token_status = expired`; stats (Path A) keep working regardless.
- Deleting a user/connection must purge secrets (security + GDPR).
- `handle` (public profile slug) is globally unique.

### 1.5 Missing data requirements I'm adding (challenge to current skeleton)
The original 3-table skeleton (User/Connection/Problem) is **insufficient for production**. I'm adding:
- **OAuthIdentity** — separate GitHub identity + encrypted token from `users` (multi-provider future, least-privilege).
- **ConnectionSecret** — encrypted sync token in its **own table**, not on `connections` (limits exposure, column-level access control).
- **GithubRepo** — per-platform repo mapping + settings.
- **SyncRun** — execution history, status, error, counts.
- **StatsSnapshot** — cached Path A aggregates (resilience when upstream is down; read-heavy dashboards).
- **AuthSession** — refresh-token records (rotation/reuse-detection/device list).
- **Notification**, **AuditLog** — user alerts + security trail.

### 1.6 Future scalability considerations
Millions of users × hundreds of problems = **hundreds of millions of `problems` rows** → plan partitioning/archiving early; cache stats in Redis + `stats_snapshots`; UUID v7 keys for shard/time-order friendliness; append-only logs partitioned by time.

---

## 2. Database Architecture

- **Engine:** PostgreSQL (relational) — the data is highly relational (users↔connections↔problems), needs strong constraints, transactions (idempotent sync), and uniqueness guarantees. NoSQL would push integrity into app code — wrong fit.
- **Single primary database, per-table service ownership** (not two databases) — avoids dual-write/drift while keeping clear boundaries via DB roles. *(Critique resolved: the skeleton implied two Prisma schemas → drift risk. One DB, strict ownership.)*
- **Normalization:** **3NF baseline**. Intentional, documented denormalization for read performance: `connections.solved_count` (cached), `stats_snapshots` (materialized aggregates), `github_repos.file_count`. Everything else normalized.
- **Keys:** **UUID v7** (time-sortable) primary keys — non-enumerable (anti-IDOR/enumeration), index-friendly, shard-ready. Enums via Postgres native enum types (or lookup tables if values churn).
- **Data flow:** writes are transactional and owner-scoped; reads for dashboards hit Redis/`stats_snapshots` first; sync writes are idempotent (upsert on natural unique keys).
- **Scalability strategy:** vertical first → read replicas for read-heavy (stats/public profile) → partition `problems`, `sync_runs`, `audit_logs`, `notifications` → archive cold data. Redis for cache + rate-limit + queue.
- **Extensibility:** new platform = new enum value + rows (no schema change); `metadata jsonb` columns absorb platform-specific extras without migrations.

---

## 3. Complete Entity List

| Entity | Purpose | Depends on (parent) | Children |
|--------|---------|---------------------|----------|
| **User** | Account/identity root | — | OAuthIdentity, Connection, GithubRepo, Problem, SyncRun, StatsSnapshot, Notification, AuthSession, AuditLog |
| **OAuthIdentity** | External login (GitHub) + encrypted provider token | User | — |
| **Connection** | A user↔platform link (handle + sync state) | User | ConnectionSecret, Problem, SyncRun |
| **ConnectionSecret** | Encrypted platform sync token (1:1) | Connection | — |
| **GithubRepo** | Per-platform target repo + settings | User | — |
| **Problem** | A synced solved problem | User, Connection | — |
| **SyncRun** | One sync execution (history) | User, Connection | — |
| **StatsSnapshot** | Cached Path A aggregate per user/platform | User | — |
| **Notification** | User-facing event | User | — |
| **AuthSession** | Refresh-token/session record | User | — |
| **AuditLog** | Security-relevant event (append-only) | User (nullable for system) | — |

> No important entity missing. `StatsSnapshot` and `ConnectionSecret` are the two that elevate this from prototype to production.

---

## 4. Complete Database Schema (table dictionary)

> Types are PostgreSQL. **PK**=primary key, **FK**=foreign key, **U**=unique, **NN**=not null. `created_at`/`updated_at` are `timestamptz` (UTC), defaulted; `updated_at` auto-touched by trigger.

### users
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid (v7) | ✓ | gen | **PK** |
| github_login | text | ✓ | | **U**; lowercased |
| handle | citext | ✓ | | **U**; regex `^[a-z0-9_-]{3,30}$` (public slug) |
| display_name | text | | | ≤80 |
| email | citext | | | nullable; **never in public reads** |
| avatar_url | text | | | GitHub avatar |
| role | enum user_role | ✓ | 'user' | server-set |
| plan | enum plan_type | ✓ | 'free' | reserved (pricing deferred) |
| public_profile_enabled | boolean | ✓ | true | |
| created_at | timestamptz | ✓ | now() | |
| updated_at | timestamptz | ✓ | now() | |
| deleted_at | timestamptz | | | **soft delete** |

### oauth_identities
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| provider | enum oauth_provider | ✓ | 'github' | |
| provider_user_id | text | ✓ | | **U**(provider, provider_user_id) |
| access_token_cipher | bytea | ✓ | | encrypted (envelope) |
| token_iv | bytea | ✓ | | |
| key_version | smallint | ✓ | 1 | KMS key rotation ref |
| scopes | text[] | | | granted scopes |
| created_at / updated_at | timestamptz | ✓ | now() | |

### connections
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| platform | enum platform_type | ✓ | | |
| username | text | ✓ | | strict regex (anti-SSRF) |
| sync_enabled | boolean | ✓ | false | |
| token_status | enum token_status | ✓ | 'none' | none/active/expired |
| token_expires_at | timestamptz | | | best-effort |
| solved_count | integer | ✓ | 0 | **denormalized** cache |
| last_synced_at | timestamptz | | | |
| metadata | jsonb | | '{}' | platform extras |
| created_at / updated_at | timestamptz | ✓ | now() | |
| deleted_at | timestamptz | | | soft delete |
| | | | | **U**(user_id, platform) |

### connection_secrets  *(1:1, isolated for least-privilege)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| connection_id | uuid | ✓ | | **PK** + **FK**→connections.id (CASCADE) |
| token_cipher | bytea | ✓ | | encrypted session token |
| token_iv | bytea | ✓ | | |
| key_version | smallint | ✓ | 1 | |
| rotated_at | timestamptz | | | |
| created_at / updated_at | timestamptz | ✓ | now() | |

### github_repos
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| platform | enum platform_type | ✓ | | |
| repo_full_name | text | ✓ | | e.g. owner/Repo |
| visibility | enum repo_visibility | ✓ | 'public' | public/private |
| folder_convention | enum folder_convention | ✓ | 'number' | number/difficulty/topic |
| default_branch | text | ✓ | 'main' | |
| file_count | integer | ✓ | 0 | denormalized |
| last_sync_at | timestamptz | | | |
| created_at / updated_at | timestamptz | ✓ | now() | |
| | | | | **U**(user_id, platform) |

### problems  *(git-service owned; high-volume)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| connection_id | uuid | ✓ | | **FK**→connections.id (CASCADE) |
| platform | enum platform_type | ✓ | | |
| number | text | ✓ | | e.g. "369" |
| slug | text | ✓ | | platform slug |
| title | text | ✓ | | sanitized (untrusted upstream) |
| difficulty | enum difficulty | | | easy/medium/hard/null |
| topics | text[] | | | tags |
| language | text | | | |
| solution_path | text | | | GitHub path (code lives in GitHub, **not DB**) |
| solved_at | timestamptz | | | |
| synced_to_git | boolean | ✓ | false | |
| synced_at | timestamptz | | | |
| metadata | jsonb | | '{}' | rating, etc. |
| created_at / updated_at | timestamptz | ✓ | now() | |
| | | | | **U**(user_id, platform, slug) (idempotency) |

### sync_runs  *(history; high-volume)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| connection_id | uuid | ✓ | | **FK**→connections.id (CASCADE) |
| status | enum sync_status | ✓ | 'queued' | queued/running/success/partial/failed/expired |
| trigger | enum sync_trigger | ✓ | 'schedule' | schedule/manual |
| items_fetched | integer | ✓ | 0 | |
| items_pushed | integer | ✓ | 0 | |
| error_code | text | | | typed code if failed |
| started_at | timestamptz | | | |
| finished_at | timestamptz | | | |
| created_at | timestamptz | ✓ | now() | |

### stats_snapshots  *(cached Path A aggregate; read resilience)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| platform | enum platform_type | ✓ | | (or 'all' aggregate row) |
| payload | jsonb | ✓ | | aggregated stats blob |
| fetched_at | timestamptz | ✓ | now() | for staleness/TTL |
| | | | | **U**(user_id, platform) |

### notifications  *(append-mostly)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| type | enum notification_type | ✓ | | sync/expiry/badge/repo/system |
| title | text | ✓ | | |
| body | text | | | |
| read_at | timestamptz | | | null = unread |
| created_at | timestamptz | ✓ | now() | |

### auth_sessions  *(refresh tokens; rotation)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | ✓ | | **FK**→users.id (CASCADE) |
| refresh_token_hash | text | ✓ | | **U**; store **hash only** |
| family_id | uuid | ✓ | | rotation family (reuse-detection) |
| user_agent | text | | | device |
| ip | inet | | | |
| expires_at | timestamptz | ✓ | | |
| revoked_at | timestamptz | | | |
| created_at | timestamptz | ✓ | now() | |

### audit_logs  *(append-only, immutable)*
| Column | Type | NN | Default | Constraints |
|--------|------|----|---------|-------------|
| id | uuid | ✓ | gen | **PK** |
| user_id | uuid | | | **FK**→users.id (SET NULL); null=system |
| action | enum audit_action | ✓ | | connect/disconnect/token_refresh/delete/admin/… |
| target_type | text | | | e.g. connection |
| target_id | uuid | | | |
| ip | inet | | | |
| metadata | jsonb | | '{}' | **no secrets/PII** |
| created_at | timestamptz | ✓ | now() | |

**Enums:** `user_role(user,admin)` · `plan_type(free,pro)` · `oauth_provider(github)` · `platform_type(leetcode,codeforces,codechef,hackerrank)` · `token_status(none,active,expired)` · `repo_visibility(public,private)` · `folder_convention(number,difficulty,topic)` · `difficulty(easy,medium,hard)` · `sync_status(queued,running,success,partial,failed,expired)` · `sync_trigger(schedule,manual)` · `notification_type(sync,expiry,badge,repo,system)` · `audit_action(...)`.

---

## 5. Relationships

| From → To | Type | FK on | On delete | On update | Why |
|-----------|------|-------|-----------|-----------|-----|
| User → OAuthIdentity | 1:M | oauth_identities.user_id | CASCADE | CASCADE | identities die with user |
| User → Connection | 1:M | connections.user_id | CASCADE | CASCADE | connections belong to user |
| Connection → ConnectionSecret | 1:1 | connection_secrets.connection_id | CASCADE | CASCADE | secret purged with connection |
| User → GithubRepo | 1:M | github_repos.user_id | CASCADE | CASCADE | mappings per user |
| User → Problem | 1:M | problems.user_id | CASCADE | CASCADE | |
| Connection → Problem | 1:M | problems.connection_id | CASCADE | CASCADE | problems from a connection |
| User/Connection → SyncRun | 1:M | sync_runs.*_id | CASCADE | CASCADE | history |
| User → StatsSnapshot | 1:M | stats_snapshots.user_id | CASCADE | CASCADE | cache per platform |
| User → Notification | 1:M | notifications.user_id | CASCADE | CASCADE | |
| User → AuthSession | 1:M | auth_sessions.user_id | CASCADE | CASCADE | revoke on delete |
| User → AuditLog | 1:M | audit_logs.user_id | **SET NULL** | CASCADE | keep audit trail after user delete |

- **Junction tables / M:N:** none required today. (Topics are a small `text[]`, not worth a join table yet; if topic analytics grow, normalize to `topics` + `problem_topics` later.)
- **Cascade rationale:** all user-owned data cascades on delete (clean GDPR purge), **except audit_logs** which retains history with a nulled user reference.

---

## 6. ER Diagram (text)

```
                         ┌──────────────┐
                         │    USERS     │ (root; soft-delete)
                         └──────┬───────┘
   ┌─────────────┬─────────────┼───────────────┬──────────────┬───────────────┐
   ▼             ▼             ▼               ▼              ▼               ▼
OAUTH_IDENTITIES CONNECTIONS  GITHUB_REPOS  STATS_SNAPSHOTS NOTIFICATIONS  AUTH_SESSIONS
(github token)   │ (1 per      (1 per         (cache per      (alerts)       (refresh tok)
                 │  platform)   platform)      platform)
                 ├────────────┐
                 ▼            ▼
        CONNECTION_SECRETS   PROBLEMS ──┐        AUDIT_LOGS (append-only, user_id nullable)
        (1:1 enc token)      │          │
                             ▼          ▼
                          SYNC_RUNS  (problems & runs reference connection + user)
```
Legend: `──▶` 1:M, `1:1` one-to-one. CASCADE on user delete except AUDIT_LOGS (SET NULL).

---

## 7. Data Integrity Rules

- **Unique:** users.github_login, users.handle, oauth(provider,provider_user_id), connections(user_id,platform), github_repos(user_id,platform), problems(user_id,platform,slug), auth_sessions.refresh_token_hash, stats_snapshots(user_id,platform).
- **FK rules:** all owner FKs CASCADE (audit_logs SET NULL).
- **Check constraints:** `handle ~ '^[a-z0-9_-]{3,30}$'`; `solved_count >= 0`; `items_pushed <= items_fetched`; `token_status` consistent with `sync_enabled` (enabled ⇒ secret exists); enum domains enforce valid values.
- **Mandatory (NN):** ids, user_id (except system audit), platform/username on connections, slug/number/title on problems, token ciphers/ivs on secrets, refresh hash/expiry on sessions.
- **Optional:** email, avatar, difficulty, language, solved_at, error_code, body, etc.
- **Business rules (DB + app):** one connection per platform; idempotent problem upsert; deletion purges secrets; expired tokens don't block stats.

---

## 8. Indexing Strategy

| Index | Table(s) | Type | Why |
|-------|----------|------|-----|
| PK (id) | all | btree | primary lookups |
| github_login U, handle U | users | btree/citext | login + public profile by slug |
| (user_id) | connections, github_repos, problems, sync_runs, notifications, stats_snapshots, auth_sessions | btree | owner-scoped reads (the #1 access pattern) |
| (user_id, platform) U | connections, github_repos, stats_snapshots | btree | per-platform lookups + uniqueness |
| (user_id, platform, slug) U | problems | btree | idempotent upsert + dedupe |
| (connection_id, started_at DESC) | sync_runs | btree | latest runs per connection |
| (user_id, created_at DESC) | notifications | btree | paginated feed |
| (user_id, read_at) partial WHERE read_at IS NULL | notifications | partial | unread badge count |
| (provider, provider_user_id) U | oauth_identities | btree | OAuth lookup |
| refresh_token_hash U | auth_sessions | btree | session verify |
| (user_id, created_at) | audit_logs | btree | audit queries |
| GIN on problems.topics | problems | GIN | topic filtering/analytics |
| GIN on metadata (where queried) | problems/connections | GIN | jsonb filters (optional) |
| FTS (title) | problems | GIN tsvector | dashboard search (optional, P2) |

**Principles:** index the columns in WHERE/JOIN/ORDER BY of real queries; partial index for the unread-count hot path; GIN for array/jsonb; **avoid over-indexing** write-heavy tables (problems, sync_runs) — only what's queried.

---

## 9. Performance Optimization

- **Query optimization:** owner-scoped queries always filter `user_id` (indexed); avoid N+1 via batched repository reads.
- **Pagination:** **cursor-based** (keyset on `(created_at, id)` or `(started_at, id)`) for problems, sync_runs, notifications, activity — stable under inserts, fast at depth.
- **Caching:** Redis for `/stats` + public profile (TTL 5–15 min); `stats_snapshots` as durable fallback when upstream platforms are down.
- **Read-heavy** (stats, public profile): Redis + read replicas; snapshots avoid recomputation.
- **Write-heavy** (problems, sync_runs, audit_logs, notifications): minimal indexes, batch inserts, idempotent upserts, async via queue (not request path).
- **Partitioning (when large):** `sync_runs` & `audit_logs` & `notifications` by **time (monthly range)**; `problems` by **hash(user_id)** if it exceeds ~100M rows. Defer until metrics justify.
- **Archiving:** move `sync_runs`/`audit_logs` older than N months to cold storage; keep `problems` (small per user, valuable) hot.
- **Denormalization (intentional):** `connections.solved_count`, `github_repos.file_count`, `stats_snapshots` — refreshed on sync; documented to avoid drift.

---

## 10. Security

- **Encryption at rest:** managed-DB/disk encryption **plus** application-layer **envelope encryption** for `oauth_identities.access_token_cipher` and `connection_secrets.token_cipher` (key in KMS, `key_version` for rotation).
- **Encryption in transit:** TLS to DB and Redis (verify-full).
- **Sensitive data:** tokens isolated in `connection_secrets`/`oauth_identities` (separate tables → column/table-level access control, smaller blast radius). **Code is not stored** (lives in GitHub).
- **Password storage:** N/A (OAuth-only). Refresh tokens stored **hashed**, never plaintext.
- **Secret management:** DB creds + master keys in a secrets manager; no plaintext in env/CI.
- **Least privilege:** distinct DB roles per service — `web-backend` role: write users/oauth/connections/secrets/github_repos/stats; read problems/sync_runs. `git-service` role: write problems/sync_runs; read connections/secrets/github_repos. Neither is superuser. A separate restricted role for read replicas/analytics with **no access to secret tables**.
- **Row-level security (RLS):** optional hardening — enable RLS so every query is forced to filter `user_id = current_app_user`; valuable defense-in-depth against app-layer IDOR bugs.
- **Audit logs:** append-only `audit_logs`; revoke UPDATE/DELETE on it for app roles.

---

## 11. Audit & History

| Table | Created/Updated | Soft delete | History/Audit | Why |
|-------|-----------------|-------------|---------------|-----|
| users | ✓ | ✓ (deleted_at) | via audit_logs | GDPR delete + retain trail |
| connections | ✓ | ✓ | audit (connect/disconnect) | reversible; security-relevant |
| connection_secrets | ✓ | — (hard purge) | audit (authorize/rotate) | secrets must be purged, not soft |
| problems | ✓ | — | — | idempotent; re-derivable from GitHub |
| sync_runs | created | — | **is the history** | run-by-run record |
| github_repos | ✓ | — | audit (config change) | track mapping changes |
| notifications | created | — | — | ephemeral |
| auth_sessions | created | revoked_at | reuse-detection | session lifecycle |
| audit_logs | created | — (immutable) | itself | security trail |

**Version history:** not needed for domain data (GitHub is the system of record for code). If settings history is ever required, add a generic `change_history` table rather than per-table versioning.

---

## 12. Future Scalability

- **Millions of users / large datasets:** UUID v7 keys (shard/order-friendly); partition high-volume tables; read replicas; Redis cache layer; keep `problems` lean (no code blobs).
- **New features:** `metadata jsonb` + new enum values absorb most additions without migrations; `plan` already reserved for pricing.
- **Additional roles:** `user_role` enum extends (e.g., `moderator`) without schema change; consider a `permissions` table only if RBAC grows complex.
- **Multi-tenancy:** **not appropriate now** (single-user product, no orgs). If teams arrive later: add `organizations` + `memberships` + `org_id` on owned rows + RLS by org. Designed so this is additive.
- **Horizontal scaling:** read replicas first; if write-bound, shard `problems`/`sync_runs` by `hash(user_id)`; logs to partitioned/append stores; Redis cluster.

---

## 13. Migration Strategy

- **Initial schema:** one baseline migration (Prisma Migrate) creating enums, tables, constraints, indexes.
- **Versioning:** migrations are immutable, ordered, committed; one logical change per migration; reviewed in PR.
- **Future migrations:** **expand → migrate → contract** for breaking changes (add nullable column → backfill → enforce NN → drop old) to allow zero-downtime deploys; never destructive in a single step.
- **Rollback:** every migration has a tested down/rollback; prefer forward-fix in prod; keep deploys reversible.
- **Backup & restore:** automated encrypted backups + PITR (point-in-time recovery); **restore drills** quarterly; backups hold ciphertext only (keys separate in KMS).
- **Seeding:** minimal seed (enum reference data implicit; an admin bootstrap documented, not committed with secrets).

---

## 14. Sample Data Flow (conceptual, no SQL)

**Sign in (GitHub):** read/insert `users`; upsert `oauth_identities` (encrypted token); insert `auth_sessions`; append `audit_logs(connect)`. *Tables:* users, oauth_identities, auth_sessions, audit_logs.

**Connect a platform (stats):** insert `connections` (unique per platform); append `audit_logs`. No secret yet → `sync_enabled=false`.

**Authorize sync:** insert `connection_secrets` (encrypted); update `connections.token_status=active, sync_enabled=true`; audit. *Reads later by git-service.*

**Load dashboard (Path A):** read `connections`; check Redis → on miss, app fetches platform stats and writes `stats_snapshots` (upsert per platform) + Redis; render. If upstream down → serve last `stats_snapshots`.

**Auto/Manual sync (Path B):** git-service reads `connections`+`connection_secrets`(decrypt)+`github_repos`; inserts `sync_runs(queued→running)`; **upserts `problems`** on (user,platform,slug); pushes to GitHub; updates `connections.solved_count/last_synced_at`, `github_repos.file_count`; sets `sync_runs(success/partial/failed)`; inserts `notifications`; on bad token → `connections.token_status=expired` + `notifications(expiry)`. *Idempotent: re-run touches no duplicates.*

**Public profile view:** read `users` (public fields) + `stats_snapshots`; cached; never reads secrets/email.

**Account deletion:** soft-delete `users`; **hard-delete `connection_secrets` + revoke/delete `oauth_identities` tokens**; cascade other owned rows on hard-purge job; `audit_logs` retained with nulled user_id.

---

## 15. Database Quality Review (self-critique + refinements)

| Concern | Finding | Refinement |
|--------|---------|-----------|
| Bottleneck | `problems` grows huge | Lean rows (no code), index only what's queried, plan hash-partition >100M |
| Bottleneck | Stats recompute on every load | `stats_snapshots` + Redis; upstream-failure fallback |
| Redundancy | `solved_count`/`file_count` duplicate derivable data | Accept (read perf); refresh on sync; documented denormalization |
| Missing rel | Skeleton lacked secrets/sync history/sessions | Added ConnectionSecret, SyncRun, AuthSession, OAuthIdentity, StatsSnapshot |
| Perf risk | Unread-count scans | Partial index on `read_at IS NULL` |
| Security risk | Tokens on main row, in logs, in backups | Isolated secret tables + envelope encryption + restricted role + RLS option |
| Normalization | Topics as array vs table | Keep `text[]`+GIN now; normalize to junction only if topic analytics demand |
| Integrity | sync_enabled vs secret mismatch | Check/trigger enforces enabled ⇒ secret exists |
| Enum churn | Enums vs lookup tables | Enums fine for stable sets (platforms/roles); switch to lookup if values churn |
| Multi-tenancy | Premature now | Deferred; additive org model designed |

**Verdict:** after these refinements the schema is production-ready, normalized (3NF) with justified denormalization, secure for the crown-jewel tokens, and scalable to millions of users with a clear partition/replica path.

---

## 16. Final Deliverables

### 16.1 Relationship matrix
| | users | oauth | conn | secret | repo | problem | run | snap | notif | session | audit |
|--|--|--|--|--|--|--|--|--|--|--|--|
| **users** | — | 1:M | 1:M | — | 1:M | 1:M | 1:M | 1:M | 1:M | 1:M | 1:M |
| **connections** | M:1 | — | — | 1:1 | — | 1:M | 1:M | — | — | — | — |

### 16.2 Table dictionary → §4 · Constraints → §7 · Indexing → §8 · Security → §10 · Scalability → §12.

### 16.3 Database development roadmap
```
D0 Baseline migration (enums, tables, constraints, indexes) + per-service DB roles
D1 Seed/admin bootstrap + restore drill + backups/PITR configured
D2 Add Redis cache + stats_snapshots refresh path
D3 Observability: slow-query log, index usage review
D4 Load test (stats reads + sync writes); tune indexes
D5 Enable RLS (defense-in-depth) + key rotation drill
D6 Partition plan armed (triggers when row thresholds hit) + archiving job
```

### 16.4 Final checklist
- [ ] 3NF with documented denormalization (solved_count, file_count, stats_snapshots)
- [ ] Tokens isolated + envelope-encrypted; refresh hashed; code not stored
- [ ] All unique/FK/check constraints in place; CASCADE except audit (SET NULL)
- [ ] Indexes match real query patterns; partial unread index; GIN topics
- [ ] Per-service least-privilege DB roles; RLS option ready; audit append-only
- [ ] Cursor pagination on all large lists
- [ ] Backups + PITR + restore drill; expand→migrate→contract for changes
- [ ] Soft-delete users; hard-purge secrets on delete (GDPR)
- [ ] Partition/replica/archive plan documented and threshold-triggered

> This is the definitive database specification. When you ask, I can produce the **Prisma schema (still as a planning artifact)** or a per-table migration order — no application code.
