import React from "react";

interface StatCardProps {
  label: string;
  icon: React.ReactNode;
  value: string | number;
  delta?: string;
  deltaClass?: string;
}

export function StatCard({ label, icon, value, delta, deltaClass = "" }: StatCardProps) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-[var(--r)] p-4">
      <div className="text-[12.5px] text-[var(--muted)] font-semibold flex items-center gap-[7px] [&>svg]:text-[var(--accent)] [&>svg.a]:text-[var(--orange)] [&>svg.r]:text-[var(--rose)]">
        {icon}
        {label}
      </div>
      <div className="text-[27px] font-extrabold tracking-[-0.03em] mt-2">{value}</div>
      {delta && <div className={`text-[12px] font-semibold mt-0.5 ${deltaClass === 'warm' ? 'text-[var(--orange)]' : deltaClass === 'pink' ? 'text-[var(--rose)]' : 'text-[var(--accent-2)]'}`}>{delta}</div>}
    </div>
  );
}
