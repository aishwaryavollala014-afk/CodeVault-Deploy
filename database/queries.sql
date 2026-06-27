-- ============================================================================
-- CodeVault — Example Queries (DBMS topic showcase, tailored to our schema)
-- ----------------------------------------------------------------------------
-- Educational/reference: demonstrates DQL/DML/TCL/DCL features against the real
-- CodeVault tables. Safe to run read queries; mutations use a transaction you
-- can ROLLBACK. Mirrors the access patterns the app/services use.
-- ============================================================================

-- ===== DQL: SELECT, projection, filtering =====
SELECT id, handle, "displayName", "createdAt"
FROM users
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;

-- ===== INNER JOIN — a user's connections =====
SELECT u.handle, c.platform, c.username, c."solvedCount"
FROM users u
JOIN connections c ON c."userId" = u.id
WHERE u.handle = 'testuser' AND c."deletedAt" IS NULL;

-- ===== LEFT JOIN + aggregate + GROUP BY + HAVING =====
SELECT u.handle, count(p.id) AS problems
FROM users u
LEFT JOIN problems p ON p."userId" = u.id
GROUP BY u.handle
HAVING count(p.id) >= 0
ORDER BY problems DESC;

-- ===== Aggregates with FILTER (conditional aggregation) =====
SELECT
  count(*)                                   AS total_connections,
  count(*) FILTER (WHERE "tokenStatus"='active')  AS active,
  count(*) FILTER (WHERE "tokenStatus"='expired') AS expired,
  COALESCE(sum("solvedCount"), 0)            AS solved_sum
FROM connections
WHERE "deletedAt" IS NULL;

-- ===== Scalar / correlated SUBQUERY =====
SELECT c.platform, c.username
FROM connections c
WHERE c."solvedCount" > (
  SELECT COALESCE(avg("solvedCount"), 0) FROM connections WHERE platform = c.platform
);

-- ===== IN / EXISTS subqueries =====
SELECT handle FROM users u
WHERE EXISTS (SELECT 1 FROM connections c WHERE c."userId" = u.id AND c."syncEnabled");

-- ===== WINDOW FUNCTIONS — rank users per platform =====
SELECT platform, username, "solvedCount",
       rank()       OVER (PARTITION BY platform ORDER BY "solvedCount" DESC) AS rnk,
       dense_rank() OVER (PARTITION BY platform ORDER BY "solvedCount" DESC) AS dense_rnk,
       round(100.0 * "solvedCount"
             / NULLIF(sum("solvedCount") OVER (PARTITION BY platform), 0), 1) AS pct_of_platform
FROM connections
WHERE "deletedAt" IS NULL;

-- ===== CTE + aggregate (readable multi-step) =====
WITH per_platform AS (
  SELECT platform, count(*) AS users, sum("solvedCount") AS solved
  FROM connections WHERE "deletedAt" IS NULL
  GROUP BY platform
)
SELECT platform, users, solved,
       round(solved::numeric / NULLIF(users, 0), 1) AS avg_solved_per_user
FROM per_platform
ORDER BY solved DESC;

-- ===== SET OPERATION (UNION) — everyone who has either a connection or a repo =====
SELECT "userId" FROM connections WHERE "deletedAt" IS NULL
UNION
SELECT "userId" FROM github_repos;

-- ===== Recursive CTE (topic fan-out demo over a numbers series) =====
WITH RECURSIVE counter(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM counter WHERE n < 5
)
SELECT n FROM counter;

-- ===== DML: UPSERT (INSERT ... ON CONFLICT) — idempotent problem sync =====
-- (mirrors the sync engine's idempotency on (userId, platform, slug))
-- INSERT INTO problems (id,"userId","connectionId",platform,number,slug,title,"syncedToGit","updatedAt")
-- VALUES ('demo','<uid>','<cid>','leetcode','1','two-sum','1. Two Sum',true,now())
-- ON CONFLICT ("userId",platform,slug)
-- DO UPDATE SET "syncedToGit"=EXCLUDED."syncedToGit", "updatedAt"=now();

-- ===== TCL: transaction + isolation level + savepoint + rollback =====
BEGIN ISOLATION LEVEL READ COMMITTED;
  SAVEPOINT before_demo;
  -- ... mutations here would be transactional/atomic ...
  ROLLBACK TO SAVEPOINT before_demo;   -- undo just this savepoint
ROLLBACK;                              -- discard the whole demo transaction

-- ===== Query optimization: inspect the plan (uses idx_problems on userId) =====
EXPLAIN ANALYZE
SELECT * FROM problems WHERE "userId" = 'does-not-exist' ORDER BY "solvedAt" DESC LIMIT 20;

-- ===== Call a stored function (from views_triggers_functions.sql) =====
-- SELECT refresh_solved_count('<connectionId>');

-- ===== Read the analytics views =====
SELECT * FROM v_user_dashboard;
SELECT * FROM v_platform_leaderboard;
SELECT * FROM v_sync_health;
SELECT * FROM v_unread_notifications;

-- ===== DCL (reference) — least-privilege grants live in web-backend/prisma/sql/roles.sql =====
-- GRANT SELECT ON v_user_dashboard TO cv_read;
