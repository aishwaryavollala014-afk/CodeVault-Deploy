import React from "react";

export function PlatformList() {
  return (
    <div className="panel">
      <div className="h">Platform Breakdown</div>
      <div className="pf">
        <div className="pf-row">
          <div className="lab"><div className="badge-ic lc">LC</div> LeetCode</div>
          <div className="pf-bar"><i style={{ width: "65%", background: "#ffa116" }}></i></div>
          <div className="val">172</div>
        </div>
        <div className="pf-row">
          <div className="lab"><div className="badge-ic cf">CF</div> Codeforces</div>
          <div className="pf-bar"><i style={{ width: "25%", background: "#1f8acb" }}></i></div>
          <div className="val">68</div>
        </div>
        <div className="pf-row">
          <div className="lab"><div className="badge-ic cc">CC</div> CodeChef</div>
          <div className="pf-bar"><i style={{ width: "5%", background: "#7a5230" }}></i></div>
          <div className="val">14</div>
        </div>
        <div className="pf-row">
          <div className="lab"><div className="badge-ic hr">HR</div> HackerRank</div>
          <div className="pf-bar"><i style={{ width: "4%", background: "#1aa260" }}></i></div>
          <div className="val">11</div>
        </div>
      </div>
    </div>
  );
}
