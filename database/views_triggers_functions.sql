-- ============================================================================
-- CodeVault — DBMS features: FUNCTIONS, TRIGGERS, VIEWS
-- ----------------------------------------------------------------------------
-- Applied OUT-OF-BAND from Prisma (Prisma manages tables/enums/indexes; these
-- raw objects live here so they aren't flagged as drift). Re-run is idempotent.
--   Apply:  docker exec -i codevault-postgres psql -U codevault -d codevault < database/views_triggers_functions.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) STORED FUNCTION + TRIGGERS — auto-touch updatedAt at the DB layer.
--    (Defense-in-depth: keeps updatedAt correct even for non-Prisma writes.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','oauth_identities','connections','connection_secrets','github_repos','problems'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON %1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON %1$I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) STORED FUNCTION — denormalized solved_count refresh for a connection
--    (demonstrates a callable PL/pgSQL function with a return value).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_solved_count(p_connection_id text)
RETURNS integer AS $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM problems WHERE "connectionId" = p_connection_id;
  UPDATE connections SET "solvedCount" = n WHERE id = p_connection_id;
  RETURN n;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3) VIEWS — read models for dashboards/analytics (joins, aggregates,
--    FILTER, window functions, DISTINCT ON).
-- ---------------------------------------------------------------------------

-- Per-user dashboard summary (LEFT JOIN + aggregate + FILTER).
CREATE OR REPLACE VIEW v_user_dashboard AS
SELECT u.id               AS user_id,
       u.handle,
       u."displayName",
       count(DISTINCT c.id)                                AS connection_count,
       COALESCE(sum(c."solvedCount"), 0)                   AS total_solved_cached,
       count(p.id)                                         AS problems_tracked,
       count(p.id) FILTER (WHERE p."syncedToGit")          AS problems_synced
FROM users u
LEFT JOIN connections c ON c."userId" = u.id AND c."deletedAt" IS NULL
LEFT JOIN problems    p ON p."userId" = u.id
WHERE u."deletedAt" IS NULL
GROUP BY u.id, u.handle, u."displayName";

-- Public leaderboard per platform (WINDOW FUNCTION rank).
CREATE OR REPLACE VIEW v_platform_leaderboard AS
SELECT c.platform,
       u.handle,
       c."solvedCount",
       rank() OVER (PARTITION BY c.platform ORDER BY c."solvedCount" DESC) AS platform_rank
FROM connections c
JOIN users u ON u.id = c."userId"
WHERE c."deletedAt" IS NULL AND u."publicProfileEnabled" AND u."deletedAt" IS NULL;

-- Latest sync run per connection (DISTINCT ON).
CREATE OR REPLACE VIEW v_sync_health AS
SELECT DISTINCT ON (sr."connectionId")
       sr."connectionId",
       c.platform,
       c.username,
       sr.status,
       sr."itemsPushed",
       sr."finishedAt"
FROM sync_runs sr
JOIN connections c ON c.id = sr."connectionId"
ORDER BY sr."connectionId", sr."createdAt" DESC;

-- Unread notification counts (aggregate over the partial-index hot path).
CREATE OR REPLACE VIEW v_unread_notifications AS
SELECT "userId", count(*) AS unread
FROM notifications
WHERE "readAt" IS NULL
GROUP BY "userId";
