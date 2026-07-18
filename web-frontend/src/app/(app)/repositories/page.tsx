"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlatformChip } from "@/components/PlatformChip";
import { CodeVaultLoader } from "@/components/CodeVaultLoader";
import { RepoHeader } from "@/components/repositories/RepoHeader";
import { RepoFileTree, type ProblemFile } from "@/components/repositories/RepoFileTree";
import { RecentCommits } from "@/components/repositories/RecentCommits";
import { RepositoryMapping, type RepoMapping } from "@/components/repositories/RepositoryMapping";

import { platformName } from "@/constants/platforms";
import { apiFetch } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const GIT_URL = process.env.NEXT_PUBLIC_GIT_SERVICE_URL || "http://localhost:5050/api";

type Conn = { platform: string; username: string };

/* ——— View modes ——— */
type ViewMode = "manage" | "browse";

export default function RepositoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ githubLogin: string } | null>(null);

  // ── Manage-view state ──
  const [connections, setConnections] = useState<Conn[] | null>(null);
  const [repoMap, setRepoMap] = useState<Record<string, { platform: string; repoFullName: string; visibility?: string; defaultBranch?: string; folderConvention?: string; fileCount?: number }>>(
    {}
  );
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  // ── Browse-view state ──
  const [viewMode, setViewMode] = useState<ViewMode>("manage");
  const [repos, setRepos] = useState<RepoMapping[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<RepoMapping | null>(null);
  const [problems, setProblems] = useState<ProblemFile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const headers = useCallback((): Record<string, string> => {
    return { "Content-Type": "application/json" };
  }, []);

  // ── Load connections + basic repo map (manage view) ──
  const loadManageData = useCallback(() => {
    const h = headers();
    apiFetch(`${API_URL}/platforms`, { headers: h, credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Conn[]) => setConnections(Array.isArray(rows) ? rows : []))
      .catch(() => setConnections([]));
    apiFetch(`${API_URL}/github-repos`, { headers: h, credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { platform: string; repoFullName: string; visibility?: string; defaultBranch?: string; folderConvention?: string; fileCount?: number }[]) => {
        const m: Record<string, typeof rows[0]> = {};
        (rows || []).forEach((row) => { m[row.platform] = row; });
        setRepoMap(m);
      })
      .catch(() => {});
  }, [headers]);

  // ── Load repos from git-service (browse view) ──
  const loadRepos = useCallback(async () => {
    const h = headers();
    try {
      const res = await apiFetch(`${GIT_URL}/repos`, { headers: h, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRepos(data.items || []);
      }
    } catch {
      /* git-service may be down */
    }
  }, [headers]);

  // ── Load problems for a platform ──
  const loadProblems = useCallback(async (platform: string, cursor?: string) => {
    const h = headers();
    const isMore = !!cursor;
    if (isMore) {
      setLoadingMore(true);
    } else {
      setLoadingProblems(true);
    }
    try {
      const params = new URLSearchParams({ platform, limit: "30" });
      if (cursor) params.set("cursor", cursor);
      const res = await apiFetch(`${GIT_URL}/problems?${params}`, { headers: h, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const items: ProblemFile[] = data.items || [];
        setProblems((prev) => (isMore ? [...prev, ...items] : items));
        setNextCursor(data.nextCursor || null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingProblems(false);
      setLoadingMore(false);
    }
  }, [headers]);

  // ── Init ──
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ } }
    loadManageData();
    loadRepos();
  }, [loadManageData, loadRepos]);

  // ── Save repo link (manage view) ──
  const save = async (platform: string) => {
    const h = headers();
    const repoFullName = (draft[platform] ?? repoMap[platform]?.repoFullName ?? "").trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repoFullName)) {
      setStatus((s) => ({ ...s, [platform]: "error" }));
      return;
    }
    setStatus((s) => ({ ...s, [platform]: "saving" }));
    try {
      const res = await apiFetch(`${API_URL}/github-repos`, {
        method: "POST",
        credentials: 'include',
        headers: h,
        body: JSON.stringify({ platform, repoFullName }),
      });
      if (res.ok) {
        setStatus((s) => ({ ...s, [platform]: "saved" }));
        setDraft((d) => { const n = { ...d }; delete n[platform]; return n; });
        loadManageData();
        loadRepos();
      } else {
        setStatus((s) => ({ ...s, [platform]: "error" }));
      }
    } catch {
      setStatus((s) => ({ ...s, [platform]: "error" }));
    }
  };

  // ── Select repo for browsing ──
  const handleSelectRepo = (repo: RepoMapping) => {
    setSelectedRepo(repo);
    setProblems([]);
    setNextCursor(null);
    loadProblems(repo.platform);
  };

  // ── Re-sync a repo ──
  const handleResync = async () => {
    const h = headers();
    if (!selectedRepo) return;
    setSyncing(true);
    try {
      await apiFetch(`${GIT_URL}/sync`, {
        method: "POST",
        credentials: 'include',
        headers: h,
        body: JSON.stringify({}),
      });
      await loadProblems(selectedRepo.platform);
      // Nudge the NotificationBell to pick up the new sync notification immediately.
      setTimeout(() => window.dispatchEvent(new Event("cv:refresh-notifications")), 2000);
    } catch { /* ignore */ }
    setSyncing(false);
  };

  if (connections === null) {
    return <CodeVaultLoader text="Loading repositories" />;
  }

  const syncedProblems = problems.filter((p) => p.syncedToGit);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* View toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 className="h" style={{ fontSize: 24, marginBottom: 0 }}>Repositories</h1>
        <div className="seg" style={{ marginLeft: "auto" }}>
          <button className={viewMode === "manage" ? "on" : ""} onClick={() => setViewMode("manage")}>
            Manage
          </button>
          <button className={viewMode === "browse" ? "on" : ""} onClick={() => setViewMode("browse")}>
            Browse
          </button>
        </div>
      </div>

      {/* ═══════ MANAGE VIEW ═══════ */}
      {viewMode === "manage" && (
        <>
          <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
            Attach a GitHub repo (<code>owner/name</code>) to each connected platform. Accepted solutions get pushed there.
          </p>

          {connections.length === 0 ? (
            <section className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
              <svg className="ico" style={{ width: 48, height: 48, opacity: 0.2, marginBottom: 16 }} aria-hidden="true">
                <use href="#ic-github" />
              </svg>
              <p style={{ color: "var(--muted)", marginBottom: 20 }}>You have not connected any platforms yet.</p>
              <Link href="/connect" className="btn btn-primary" style={{ display: "inline-flex" }}>
                Connect a Platform
              </Link>
            </section>
          ) : (
            connections.map((c) => {
              const repo = repoMap[c.platform];
              const value = draft[c.platform] ?? repo?.repoFullName ?? "";
              const st = status[c.platform];
              return (
                <section className="panel" key={c.platform} style={{ marginBottom: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    <PlatformChip platformId={c.platform} size="sm" showName={false} variant="ghost" />
                    <b style={{ fontSize: 15 }}>{platformName(c.platform)}</b>
                    <span style={{ color: "var(--faint)", fontSize: 13 }}>@{c.username}</span>
                    {repo ? (
                      <span className="st-pill ok" style={{ marginLeft: 4 }}>Repo linked</span>
                    ) : (
                      <span className="st-pill exp" style={{ marginLeft: 4 }}>No repo yet</span>
                    )}
                    {repo && (
                      <a
                        className="btn sm"
                        style={{ marginLeft: "auto" }}
                        href={`https://github.com/${repo.repoFullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open on GitHub ↗
                      </a>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      className="txt"
                      aria-label={`${c.platform} repository`}
                      placeholder={`${user?.githubLogin || "owner"}/${c.platform}-solutions`}
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((d) => ({ ...d, [c.platform]: v }));
                        setStatus((s) => ({ ...s, [c.platform]: "" }));
                      }}
                      style={{ flex: 1, minWidth: 220 }}
                    />
                    <button className="btn btn-primary sm" type="button" onClick={() => save(c.platform)}>
                      {st === "saving" ? "Saving…" : st === "saved" ? "Saved ✓" : repo ? "Update" : "Attach repo"}
                    </button>
                  </div>
                  {st === "error" && (
                    <p style={{ color: "var(--brand-d)", fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                      Enter a valid <code>owner/name</code> repository.
                    </p>
                  )}

                  {repo && (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--faint)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>branch <b>{repo.defaultBranch || "main"}</b></span>
                      <span>folders: <b>{repo.folderConvention || "number"}</b></span>
                      <span>{repo.fileCount ? `${repo.fileCount} files synced` : "no files synced yet"}</span>
                      <Link href="/sync-status" style={{ color: "var(--brand)" }}>Sync status →</Link>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </>
      )}

      {/* ═══════ BROWSE VIEW ═══════ */}
      {viewMode === "browse" && (
        <>
          {/* Repo mapping selector */}
          <RepositoryMapping
            mappings={repos}
            onSelect={handleSelectRepo}
            selectedPlatform={selectedRepo?.platform}
          />

          {/* Selected repo details */}
          {selectedRepo && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <section className="panel" style={{ padding: 20 }}>
                <RepoHeader
                  repoFullName={selectedRepo.repoFullName}
                  visibility={selectedRepo.visibility}
                  defaultBranch={selectedRepo.defaultBranch}
                  fileCount={selectedRepo.fileCount}
                  lastSyncAt={selectedRepo.lastSyncAt}
                  folderConvention={selectedRepo.folderConvention}
                  onResync={handleResync}
                  syncing={syncing}
                />
              </section>

              {loadingProblems ? (
                <CodeVaultLoader text="Loading files" />
              ) : (
                <div className="grid g-2">
                  <RepoFileTree
                    branch={selectedRepo.defaultBranch}
                    problems={problems}
                    totalCount={problems.length}
                    hasMore={!!nextCursor}
                    onLoadMore={() => nextCursor && loadProblems(selectedRepo.platform, nextCursor)}
                    loadingMore={loadingMore}
                  />
                  <RecentCommits
                    commits={syncedProblems.slice(0, 10).map((p) => ({
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      language: p.language,
                      syncedAt: p.syncedAt,
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {!selectedRepo && repos.length > 0 && (
            <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", marginTop: 32 }}>
              Select a repository above to browse its synced files.
            </p>
          )}

          {repos.length === 0 && (
            <section className="panel" style={{ textAlign: "center", padding: "48px 20px", marginTop: 16 }}>
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>
                No repositories linked yet. Switch to <b>Manage</b> to attach a GitHub repo.
              </p>
              <button className="btn btn-primary" onClick={() => setViewMode("manage")}>
                Go to Manage
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
