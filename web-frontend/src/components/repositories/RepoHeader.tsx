import React from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

export interface RepoHeaderProps {
  owner: string;
  repoName: string;
  isPublic: boolean;
  branch: string;
  fileCount: number;
  lastSync: string;
  autoSync: boolean;
  githubUrl: string;
}

export function RepoHeader({
  owner,
  repoName,
  isPublic,
  branch,
  fileCount,
  lastSync,
  autoSync,
  githubUrl,
}: RepoHeaderProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="w-[46px] h-[46px] rounded-xl bg-[#16160f] text-white grid place-items-center flex-none">
        <svg 
          viewBox="0 0 24 24" 
          width="24" 
          height="24" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.8 5.3 3.1 5.3 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 3.9 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
        </svg>
      </div>
      
      <div>
        <div className="text-[16px] font-bold">
          {owner} /{" "}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand-d)] font-mono text-[13px] hover:underline"
          >
            {repoName}
          </a>{" "}
          {isPublic && (
            <span className="ml-1 text-[11px] font-bold px-[9px] py-[3px] rounded-full bg-[var(--brand-soft)] text-[var(--brand-d)] inline-block">
              Public
            </span>
          )}
        </div>
        
        <div className="text-[12.5px] text-[var(--faint)] mt-[3px] flex gap-[14px] flex-wrap">
          <span>
            default branch <b className="text-[var(--ink)] font-semibold">{branch}</b>
          </span>
          <span>{fileCount} files</span>
          <span>last sync {lastSync}</span>
          <span>auto-sync {autoSync ? "on" : "off"}</span>
        </div>
      </div>

      <div className="ml-auto flex gap-2.5 max-sm:ml-0 max-sm:w-full">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[7px] font-semibold text-[13.5px] rounded-[9px] border border-[var(--border-2)] bg-white px-[14px] py-[9px] cursor-pointer text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
        >
          Open on GitHub <ExternalLink size={14} className="text-[var(--faint)]" />
        </a>
        <button
          type="button"
          className="inline-flex items-center gap-[7px] font-semibold text-[13.5px] rounded-[9px] border border-[var(--brand)] bg-[var(--brand)] text-white px-[14px] py-[9px] cursor-pointer transition-colors hover:bg-[var(--brand-d)]"
        >
          <RefreshCw size={14} />
          Re-sync now
        </button>
      </div>
    </div>
  );
}
