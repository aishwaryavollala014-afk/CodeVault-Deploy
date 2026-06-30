import React from "react";

export interface Mapping {
  id: string; // e.g. "lc", "cf", "cc", "hr"
  name: string;
  label: string; // "LC", "CF", etc
  color: string; // tailwind color value e.g. "#ffa116"
  mappedRepoName: string | null;
}

export interface RepositoryMappingProps {
  mappings: Mapping[];
  onConfigure?: (mappingId: string) => void;
}

export function RepositoryMapping({ mappings, onConfigure }: RepositoryMappingProps) {
  return (
    <section className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <h2 className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">
        Repository mapping{" "}
        <span className="font-medium text-[12px] text-[var(--faint)]">
          one repo per platform
        </span>
      </h2>
      <div className="flex flex-col gap-2.5">
        {mappings.map((m) => (
          <div 
            key={m.id} 
            className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-[11px]"
          >
            <span 
              className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono flex-none"
              style={{ backgroundColor: m.color }}
            >
              {m.label}
            </span>
            <span className="text-[14.5px] font-medium">{m.name}</span>
            <span className="text-[var(--faint)] ml-1 mr-1">→</span>
            
            {m.mappedRepoName ? (
              <span className="font-mono text-[12.5px] text-[var(--brand-d)]">
                {m.mappedRepoName}
              </span>
            ) : (
              <span className="text-[12.5px] text-[var(--faint)] italic">
                Not configured
              </span>
            )}
            
            <button 
              type="button"
              onClick={() => onConfigure?.(m.id)}
              className="ml-auto inline-flex items-center gap-[7px] font-semibold text-[13.5px] rounded-[9px] border border-[var(--border-2)] bg-white px-[14px] py-[9px] cursor-pointer text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
            >
              Configure
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
