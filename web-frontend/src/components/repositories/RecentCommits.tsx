import React from "react";

export interface Commit {
  sha: string;
  msg: string;
  time: string;
}

export interface RecentCommitsProps {
  commits: Commit[];
}

export function RecentCommits({ commits }: RecentCommitsProps) {
  return (
    <section className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <h2 className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">
        Recent commits
      </h2>
      <div className="flex flex-col">
        {commits.map((c, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 py-[11px] border-b border-[var(--border)] text-[13.5px] last:border-b-0"
          >
            <span className="font-mono text-[11.5px] text-[var(--faint)] bg-[var(--paper)] px-[7px] py-[2px] rounded-md flex-none">
              {c.sha}
            </span>
            <span className="flex-1 truncate">
              {c.msg}
            </span>
            <span className="text-[var(--faint)] text-[12px] flex-none">
              {c.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
