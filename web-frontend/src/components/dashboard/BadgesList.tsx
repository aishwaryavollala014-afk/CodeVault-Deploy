import React from "react";

export function BadgesList() {
  return (
    <div className="panel">
      <div className="h">Recent Badges</div>
      <div className="badges">
        <div className="bdg">
          <div className="hex a">Ps</div>
          <div className="bt">
            <div className="n">Problem Solving</div>
            <div className="stars">★★★★★</div>
          </div>
        </div>
        <div className="bdg">
          <div className="hex r">Py</div>
          <div className="bt">
            <div className="n">Python</div>
            <div className="stars">★★★★</div>
          </div>
        </div>
        <div className="bdg">
          <div className="hex">100</div>
          <div className="bt">
            <div className="n">100 Days Badge</div>
            <div className="m">LeetCode · 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}
