-- ============================================================================
-- CodeVault — Least-privilege app roles for RLS
-- ----------------------------------------------------------------------------
-- These roles are subject to Row-Level Security policies (unlike the superuser
-- 'codevault' owner role which bypasses RLS).
--
-- Apply:  docker exec -i codevault-postgres psql -U codevault -d codevault < database/roles.sql
-- ============================================================================

-- Create app roles (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cv_web') THEN
    CREATE ROLE cv_web LOGIN PASSWORD 'cv_web_dev';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cv_git') THEN
    CREATE ROLE cv_git LOGIN PASSWORD 'cv_git_dev';
  END IF;
END $$;

-- Grant table-level access (the roles can use all tables, but RLS restricts rows)
GRANT USAGE ON SCHEMA public TO cv_web, cv_git;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cv_web, cv_git;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cv_web, cv_git;

-- Future tables created by the owner also get the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cv_web, cv_git;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO cv_web, cv_git;
