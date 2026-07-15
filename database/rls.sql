-- ============================================================================
-- CodeVault — DBMS feature: ROW-LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Defense-in-depth so the DB itself enforces "a user only sees their own rows",
-- even if an app-layer ownership check is ever missed (BOLA backstop).
--
-- HOW IT WORKS: the app sets a per-request GUC `app.current_user_id` (e.g.
--   SET LOCAL app.current_user_id = '<cuid>';  -- inside the request transaction
-- and policies filter rows by it. The owner role (superuser) BYPASSES RLS, so
-- this is enabled for the least-privilege app roles (cv_web/cv_git), not dev.
--
-- ⚠️ Apply only once the app sets the GUC + connects as cv_web/cv_git, otherwise
--    those roles will see zero rows. Provided as a ready-to-enable reference.
--   Apply:  docker exec -i codevault-postgres psql -U codevault -d codevault < database/rls.sql
-- ============================================================================

-- Helper: current app user id from the session GUC (NULL-safe).
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '');
$$ LANGUAGE sql STABLE;

-- Enable RLS + owner policy on each user-owned table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'connections','github_repos','problems','sync_runs',
    'stats_snapshots','notifications','auth_sessions','oauth_identities'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS owner_isolation ON %I;', t);
    EXECUTE format(
      'CREATE POLICY owner_isolation ON %I
         USING ("userId" = app_current_user_id())
         WITH CHECK ("userId" = app_current_user_id());', t);
  END LOOP;
END $$;

-- connection_secrets has no userId column → isolate via its parent connection.
ALTER TABLE connection_secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_isolation ON connection_secrets;
CREATE POLICY owner_isolation ON connection_secrets
  USING (EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = connection_secrets."connectionId"
      AND c."userId" = app_current_user_id()
  ));

-- users: a user may only read/update their own row.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS self_isolation ON users;
CREATE POLICY self_isolation ON users
  USING (id = app_current_user_id())
  WITH CHECK (id = app_current_user_id());

-- Public read: allow SELECT on users when publicProfileEnabled is true
-- (used by /api/public/:handle which runs without authentication).
DROP POLICY IF EXISTS public_read ON users;
CREATE POLICY public_read ON users
  FOR SELECT
  USING ("publicProfileEnabled" = true);

-- Public read: allow SELECT on connections for public profile stats.
-- The public profile endpoint queries connections by userId to aggregate stats.
DROP POLICY IF EXISTS public_read ON connections;
CREATE POLICY public_read ON connections
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = connections."userId"
      AND u."publicProfileEnabled" = true
  ));

-- To DISABLE during local dev:
--   ALTER TABLE connections DISABLE ROW LEVEL SECURITY;  -- (repeat per table)

-- ============================================================================
-- Social graph: follows + messages
-- ============================================================================

-- follows: follower lists / counts are public (SELECT true), but a user may
-- only create or remove follow rows where THEY are the follower.
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read ON follows;
CREATE POLICY public_read ON follows
  FOR SELECT
  USING (true);
DROP POLICY IF EXISTS follower_insert ON follows;
CREATE POLICY follower_insert ON follows
  FOR INSERT
  WITH CHECK ("followerId" = app_current_user_id());
DROP POLICY IF EXISTS follower_delete ON follows;
CREATE POLICY follower_delete ON follows
  FOR DELETE
  USING ("followerId" = app_current_user_id());

-- messages: strictly participant-only. Only the sender may insert (as
-- themselves); only the two participants may read; only the receiver may
-- update (to set readAt).
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS participant_read ON messages;
CREATE POLICY participant_read ON messages
  FOR SELECT
  USING ("senderId" = app_current_user_id() OR "receiverId" = app_current_user_id());
DROP POLICY IF EXISTS sender_insert ON messages;
CREATE POLICY sender_insert ON messages
  FOR INSERT
  WITH CHECK ("senderId" = app_current_user_id());
DROP POLICY IF EXISTS receiver_update ON messages;
CREATE POLICY receiver_update ON messages
  FOR UPDATE
  USING ("receiverId" = app_current_user_id())
  WITH CHECK ("receiverId" = app_current_user_id());

