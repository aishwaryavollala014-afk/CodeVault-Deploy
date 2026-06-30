import React from "react";

export function ActivityHeatmap() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-[18px]">
      <div className="text-[13.5px] font-bold m-0 mb-4 flex justify-between items-center">
        Activity <span className="font-mono text-[11px] text-[var(--faint)] font-medium">365 DAYS</span>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {/* Mock heatmap data */}
          {Array.from({ length: 50 * 7 }).map((_, i) => {
            const level = Math.random() > 0.8 ? Math.floor(Math.random() * 4) + 1 : 0;
            const bgClass = level === 1 ? "bg-[#fbd6c6]" : level === 2 ? "bg-[#f5a888]" : level === 3 ? "bg-[#f0764f]" : level === 4 ? "bg-[#d8431f]" : "bg-[#efe7df]";
            return <i key={i} className={`w-[11px] h-[11px] rounded-[3px] ${bgClass}`} title={`${level} submissions`} />;
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-[var(--faint)] mt-3">
        Less <i className="w-[10px] h-[10px] rounded-[3px] bg-[#efe7df]"></i><i className="w-[10px] h-[10px] rounded-[3px] bg-[#fbd6c6]"></i><i className="w-[10px] h-[10px] rounded-[3px] bg-[#f5a888]"></i><i className="w-[10px] h-[10px] rounded-[3px] bg-[#f0764f]"></i><i className="w-[10px] h-[10px] rounded-[3px] bg-[#d8431f]"></i> More
      </div>
    </div>
  );
}
