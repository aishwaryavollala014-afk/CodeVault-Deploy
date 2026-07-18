-- Enable RLS on user-owned tables
ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connection_secrets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "github_repos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stats_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;

-- Create policies requiring user_id to match the current_user_id set in the transaction
CREATE POLICY "User isolation" ON "connections" 
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true));

-- Note: connection_secrets joins through connections or has connectionId which we can't easily map to userId directly without a join.
-- Wait, connection_secrets has connectionId, not userId.
-- RLS on connection_secrets needs a join:
CREATE POLICY "User isolation" ON "connection_secrets" 
  FOR ALL USING (
    "connectionId" IN (
      SELECT id FROM "connections" WHERE "userId" = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "User isolation" ON "github_repos" 
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY "User isolation" ON "stats_snapshots" 
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY "User isolation" ON "notifications" 
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY "User isolation" ON "auth_sessions" 
  FOR ALL USING ("userId" = current_setting('app.current_user_id', true));
