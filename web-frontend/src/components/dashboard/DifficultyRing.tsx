import React from "react";

export function DifficultyRing() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <div className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">
        Problems Solved <span className="font-mono text-[11px] text-[var(--faint)] font-medium">ALL PLATFORMS</span>
      </div>
      <div className="flex items-center gap-[18px]">
        <div className="w-[118px] h-[118px] rounded-full flex-none grid place-items-center relative" style={{ background: "conic-gradient(var(--orange) 0 43.3%, var(--accent) 43.3% 88.2%, var(--rose) 88.2% 100%)" }}>
          <div className="absolute w-[84px] h-[84px] rounded-full bg-white"></div>
          <div className="relative text-center">
            <b className="text-[22px] font-extrabold block tracking-[-0.02em]">265</b>
            <span className="text-[11px] text-[var(--muted)]">Total</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 flex-1">
          <div className="flex items-center gap-[9px] text-[13px]">
            <div className="w-[10px] h-[10px] rounded-[3px] bg-[var(--orange)]"></div> Easy <span className="ml-auto font-mono text-[12px] text-[var(--muted)]">112</span>
          </div>
          <div className="flex items-center gap-[9px] text-[13px]">
            <div className="w-[10px] h-[10px] rounded-[3px] bg-[var(--accent)]"></div> Medium <span className="ml-auto font-mono text-[12px] text-[var(--muted)]">124</span>
          </div>
          <div className="flex items-center gap-[9px] text-[13px]">
            <div className="w-[10px] h-[10px] rounded-[3px] bg-[var(--rose)]"></div> Hard <span className="ml-auto font-mono text-[12px] text-[var(--muted)]">29</span>
          </div>
        </div>
      </div>
    </div>
  );
}
