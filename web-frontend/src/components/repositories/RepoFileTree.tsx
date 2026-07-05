"use client";

import React from "react";

export interface ProblemFile {
  id: string;
  platform: string;
  number: number | null;
  slug: string;
  title: string;
  difficulty: string | null;
  language: string;
  solutionPath: string | null;
  solvedAt: string | null;
  syncedToGit: boolean;
  syncedAt: string | null;
}

export interface RepoFileTreeProps {
  branch: string;
  problems: ProblemFile[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

function langBadge(lang: string): { bg: string; color: string } {
  switch (lang.toLowerCase()) {
    case "python":
    case "python3":
      return { bg: "var(--amber-soft)", color: "var(--amber-d)" };
    case "javascript":
    case "typescript":
      return { bg: "var(--amber-soft)", color: "var(--amber-d)" };
    case "java":
      return { bg: "var(--brand-soft)", color: "var(--brand-d)" };
    case "cpp":
    case "c++":
    case "c":
      return { bg: "var(--rose-soft)", color: "var(--rose-d)" };
    default:
      return { bg: "var(--amber-soft)", color: "var(--amber-d)" };
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RepoFileTree({
  branch,
  problems,
  totalCount,
  hasMore,
  onLoadMore,
  loadingMore,
}: RepoFileTreeProps) {
  return (
    <section className="panel">
      <h2 className="h">
        Files{" "}
        <span className="tag" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>
          {totalCount} problem{totalCount !== 1 ? "s" : ""}
        </span>
      </h2>
      <div className="fl">
        <div className="fl-bar">
          <svg className="ico sm" aria-hidden="true"><use href="#ic-repos" /></svg>
          {branch} &middot; {problems.length} shown
        </div>
        {problems.length === 0 ? (
          <div className="fl-row" style={{ justifyContent: "center", color: "var(--muted)" }}>
            No problems synced yet
          </div>
        ) : (
          problems.map((p) => {
            const badge = langBadge(p.language);
            return (
              <div className="fl-row" key={p.id}>
                <span className="nm">
                  {p.number != null && <span className="fold">▸</span>}
                  {p.number != null ? `${p.number} · ` : ""}{p.title}
                </span>
                <span className="lang" style={{ background: badge.bg, color: badge.color }}>
                  {p.language}
                </span>
                <span className="when">{timeAgo(p.solvedAt)}</span>
              </div>
            );
          })
        )}
      </div>
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button className="btn btn-secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}
