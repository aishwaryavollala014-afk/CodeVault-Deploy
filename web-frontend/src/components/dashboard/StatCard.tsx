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
    <div className="stat">
      <div className="l">
        {icon}
        {label}
      </div>
      <div className="n">{value}</div>
      {delta && <div className={`d ${deltaClass}`}>{delta}</div>}
    </div>
  );
}
