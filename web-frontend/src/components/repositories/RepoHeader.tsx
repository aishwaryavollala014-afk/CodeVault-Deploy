"use client";

import React from "react";

export interface RepoHeaderProps {
  repoFullName: string;
  visibility: string;
  defaultBranch: string;
  fileCount: number;
  lastSyncAt: string | null;
  folderConvention: string;
  onResync?: () => void;
  syncing?: boolean;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RepoHeader({
  repoFullName,
  visibility,
  defaultBranch,
  fileCount,
  lastSyncAt,
  folderConvention,
  onResync,
  syncing,
}: RepoHeaderProps) {
  const [owner, repoName] = repoFullName.split("/");
  const githubUrl = `https://github.com/${repoFullName}`;

  return (
    <div className="repohead">
      <div className="ghmark">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff" aria-hidden="true">
          <path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.8 5.3 3.1 5.3 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 3.9 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
        </svg>
      </div>
      <div>
        <div className="nm">
          {owner} /{" "}
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            {repoName}
          </a>{" "}
          {visibility === "public" && <span className="pubpill">Public</span>}
        </div>
        <div className="meta">
          <span>branch <b>{defaultBranch}</b></span>
          <span>{fileCount} files</span>
          <span>last sync {timeAgo(lastSyncAt)}</span>
          <span>folders: {folderConvention || "number"}</span>
        </div>
      </div>
      <div className="acts">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ fontSize: "13.5px" }}
        >
          Open on GitHub ↗
        </a>
        <button
          type="button"
          className="btn btn-primary"
          style={{ fontSize: "13.5px" }}
          onClick={onResync}
          disabled={syncing}
        >
          <svg className="ico sm" aria-hidden="true"><use href="#ic-sync" /></svg>
          {syncing ? "Syncing…" : "Re-sync now"}
        </button>
      </div>
    </div>
  );
}
