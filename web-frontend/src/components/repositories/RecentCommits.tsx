"use client";

import React from "react";

export interface SyncCommit {
  id: string;
  slug: string;
  title: string;
  language: string;
  syncedAt: string | null;
}

export interface RecentCommitsProps {
  commits: SyncCommit[];
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

export function RecentCommits({ commits }: RecentCommitsProps) {
  return (
    <section className="panel">
      <h2 className="h">
        Recent syncs
        <span className="tag" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>
          last {commits.length}
        </span>
      </h2>
      <div className="commits">
        {commits.length === 0 ? (
          <div className="commit" style={{ justifyContent: "center", color: "var(--muted)" }}>
            No synced problems yet
          </div>
        ) : (
          commits.map((c) => (
            <div className="commit" key={c.id}>
              <span className="sha">{c.slug}</span>
              <span className="msg">{c.title} ({c.language})</span>
              <span className="when">{timeAgo(c.syncedAt)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
