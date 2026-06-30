import React from "react";

export function BadgesList() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <div className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">Recent Badges</div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] flex-none grid place-items-center text-white font-extrabold text-[13px] bg-gradient-to-br from-[var(--orange)] to-[var(--orange)]" style={{ clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)" }}>Ps</div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">Problem Solving</div>
            <div className="text-[var(--orange)] text-[13px] tracking-[1px]">★★★★★</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] flex-none grid place-items-center text-white font-extrabold text-[13px] bg-gradient-to-br from-[var(--rose)] to-[var(--rose)]" style={{ clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)" }}>Py</div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">Python</div>
            <div className="text-[var(--orange)] text-[13px] tracking-[1px]">★★★★</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] flex-none grid place-items-center text-white font-extrabold text-[13px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)]" style={{ clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)" }}>100</div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">100 Days Badge</div>
            <div className="text-[11.5px] text-[var(--faint)]">LeetCode · 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
