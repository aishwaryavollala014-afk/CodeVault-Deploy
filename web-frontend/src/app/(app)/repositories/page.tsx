"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlatformChip } from "@/components/PlatformChip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const PLATFORM_LABELS: Record<string, string> = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  hackerrank: "HackerRank",
};

type Conn = { platform: string; username: string };
type Repo = { platform: string; repoFullName: string; visibility?: string; defaultBranch?: string; folderConvention?: string; fileCount?: number };

export default function RepositoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ githubLogin: string } | null>(null);
  const [connections, setConnections] = useState<Conn[] | null>(null);
  const [repoMap, setRepoMap] = useState<Record<string, Repo>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/platforms`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Conn[]) => setConnections(Array.isArray(rows) ? rows : []))
      .catch(() => setConnections([]));
    fetch(`${API_URL}/github-repos`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Repo[]) => {
        const m: Record<string, Repo> = {};
        (rows || []).forEach((row) => { m[row.platform] = row; });
        setRepoMap(m);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch {} }
    load();
  }, [load]);

  const save = async (platform: string) => {
    const token = localStorage.getItem("token");
    const repoFullName = (draft[platform] ?? repoMap[platform]?.repoFullName ?? "").trim();
    if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repoFullName)) {
      setStatus((s) => ({ ...s, [platform]: "error" }));
      return;
    }
    setStatus((s) => ({ ...s, [platform]: "saving" }));
    try {
      const res = await fetch(`${API_URL}/github-repos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, repoFullName }),
      });
      if (res.ok) {
        setStatus((s) => ({ ...s, [platform]: "saved" }));
        setDraft((d) => { const n = { ...d }; delete n[platform]; return n; });
        load();
      } else {
        setStatus((s) => ({ ...s, [platform]: "error" }));
      }
    } catch {
      setStatus((s) => ({ ...s, [platform]: "error" }));
    }
  };

  if (connections === null) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--faint)" }}>Loading repositories…</div>;
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <h1 className="h" style={{ fontSize: 24, marginBottom: 6 }}>Repositories</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 14 }}>
        Attach a GitHub repo (<code>owner/name</code>) to each connected platform. Accepted solutions get pushed there.
      </p>

      {connections.length === 0 ? (
        <section className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <svg className="ico" style={{ width: 48, height: 48, opacity: 0.2, marginBottom: 16 }} aria-hidden="true"><use href="#ic-github" /></svg>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>You have not connected any platforms yet.</p>
          <Link href="/connect" className="btn brand" style={{ display: "inline-flex" }}>Connect a Platform</Link>
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
                <b style={{ fontSize: 15 }}>{PLATFORM_LABELS[c.platform] || c.platform}</b>
                <span style={{ color: "var(--faint)", fontSize: 13 }}>@{c.username}</span>
                {repo ? (
                  <span className="st-pill ok" style={{ marginLeft: 4 }}>Repo linked</span>
                ) : (
                  <span className="st-pill exp" style={{ marginLeft: 4 }}>No repo yet</span>
                )}
                {repo && (
                  <a className="btn sm" style={{ marginLeft: "auto" }}
                     href={`https://github.com/${repo.repoFullName}`} target="_blank" rel="noopener noreferrer">
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
                <button className="btn brand sm" type="button" onClick={() => save(c.platform)}>
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
    </div>
  );
}
