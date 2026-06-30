import React from "react";
import { Code, FileJson } from "lucide-react";

export interface Problem {
  id: string;
  name: string;
  lang: string;
  time: string;
  isSpecial?: boolean; // For README.md etc
}

export interface RepoFileTreeProps {
  branch: string;
  totalProblems: number;
  problems: Problem[];
  rootDirectoryName?: string;
}

export function RepoFileTree({ branch, totalProblems, problems, rootDirectoryName = "LeetCodeQuestions/" }: RepoFileTreeProps) {
  return (
    <section className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <h2 className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">
        Files{" "}
        <span className="font-mono text-[11px] text-[var(--faint)] font-medium">
          {rootDirectoryName}
        </span>
      </h2>
      
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center gap-2 px-[14px] py-2.5 bg-[var(--paper)] border-b border-[var(--border)] font-mono text-[12.5px] text-[var(--muted)]">
          <Code size={14} />
          {branch} &middot; {totalProblems} problems
        </div>
        
        {/* File Rows */}
        {problems.map((p, index) => (
          <div 
            key={index} 
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-[14px] py-[11px] border-b border-[var(--border)] text-[13.5px] last:border-b-0 hover:bg-[var(--paper)] cursor-pointer"
          >
            <span className="flex items-center gap-[9px] font-mono font-semibold">
              {!p.isSpecial && <span className="text-[var(--brand-d)] flex-none">▸</span>}
              {p.isSpecial && <FileJson size={14} className="text-[var(--faint)] flex-none" />}
              {p.id !== p.name ? `${p.id} · ${p.name}` : p.name}
            </span>
            <span 
              className="text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{
                background: p.isSpecial ? "var(--brand-soft)" : "var(--amber-soft)",
                color: p.isSpecial ? "var(--brand-d)" : "var(--amber-d)"
              }}
            >
              {p.lang}
            </span>
            <span className="text-[var(--faint)] text-[12px] font-mono">
              {p.time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
