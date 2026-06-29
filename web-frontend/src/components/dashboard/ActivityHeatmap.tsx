import React from "react";

export function ActivityHeatmap() {
  return (
    <div className="panel span2">
      <div className="h">
        Activity <span className="tag">365 DAYS</span>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
        <div className="heat">
          {/* Mock heatmap data */}
          {Array.from({ length: 50 * 7 }).map((_, i) => {
            const level = Math.random() > 0.8 ? Math.floor(Math.random() * 4) + 1 : 0;
            return <i key={i} className={level > 0 ? `l${level}` : ""} title={`${level} submissions`} />;
          })}
        </div>
      </div>
      <div className="heat-legend">
        Less <i></i><i className="l1"></i><i className="l2"></i><i className="l3"></i><i className="l4"></i> More
      </div>
    </div>
  );
}
