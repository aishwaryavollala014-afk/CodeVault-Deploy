import React from "react";

export function PlatformList() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <div className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">Platform Breakdown</div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[104px_1fr_40px] items-center gap-2.5 text-[13px]">
          <div className="flex items-center gap-[7px] font-semibold"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#ffa116]">LC</div> LeetCode</div>
          <div className="h-[8px] rounded-[5px] bg-[var(--subtle)] overflow-hidden"><i className="block h-full rounded-[5px]" style={{ width: "65%", background: "#ffa116" }}></i></div>
          <div className="text-right text-[var(--muted)] font-mono text-[12px]">172</div>
        </div>
        <div className="grid grid-cols-[104px_1fr_40px] items-center gap-2.5 text-[13px]">
          <div className="flex items-center gap-[7px] font-semibold"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#1f8acb]">CF</div> Codeforces</div>
          <div className="h-[8px] rounded-[5px] bg-[var(--subtle)] overflow-hidden"><i className="block h-full rounded-[5px]" style={{ width: "25%", background: "#1f8acb" }}></i></div>
          <div className="text-right text-[var(--muted)] font-mono text-[12px]">68</div>
        </div>
        <div className="grid grid-cols-[104px_1fr_40px] items-center gap-2.5 text-[13px]">
          <div className="flex items-center gap-[7px] font-semibold"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#7a5230]">CC</div> CodeChef</div>
          <div className="h-[8px] rounded-[5px] bg-[var(--subtle)] overflow-hidden"><i className="block h-full rounded-[5px]" style={{ width: "5%", background: "#7a5230" }}></i></div>
          <div className="text-right text-[var(--muted)] font-mono text-[12px]">14</div>
        </div>
        <div className="grid grid-cols-[104px_1fr_40px] items-center gap-2.5 text-[13px]">
          <div className="flex items-center gap-[7px] font-semibold"><div className="w-[18px] h-[18px] rounded-[5px] grid place-items-center text-white text-[9px] font-extrabold font-mono bg-[#1aa260]">HR</div> HackerRank</div>
          <div className="h-[8px] rounded-[5px] bg-[var(--subtle)] overflow-hidden"><i className="block h-full rounded-[5px]" style={{ width: "4%", background: "#1aa260" }}></i></div>
          <div className="text-right text-[var(--muted)] font-mono text-[12px]">11</div>
        </div>
      </div>
    </div>
  );
}
