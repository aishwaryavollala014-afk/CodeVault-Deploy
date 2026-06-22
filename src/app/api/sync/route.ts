import { NextResponse } from "next/server";

// POST /api/sync
// Triggers a sync run: fetch new accepted submissions for each active
// connection and push any unsynced solutions to GitHub.
//
// This is invoked manually from the dashboard and on a schedule.
export async function POST() {
  // TODO:
  // 1. Load active connections from the database.
  // 2. For each, fetch recent accepted submissions (Path B).
  // 3. Diff against already-synced problems.
  // 4. Push new solutions via lib/github/sync and update the README index.
  return NextResponse.json({
    ok: true,
    message: "Sync endpoint scaffolded — implementation pending.",
  });
}
