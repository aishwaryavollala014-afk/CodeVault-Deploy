import React from "react";

export function DifficultyRing() {
  return (
    <div className="panel">
      <div className="h">
        Problems Solved <span className="tag">ALL PLATFORMS</span>
      </div>
      <div className="ringwrap">
        <div className="ring">
          <div className="rc">
            <b>265</b>
            <span>Total</span>
          </div>
        </div>
        <div className="rleg">
          <div className="r">
            <div className="sw e"></div> Easy <span className="v">112</span>
          </div>
          <div className="r">
            <div className="sw m"></div> Medium <span className="v">124</span>
          </div>
          <div className="r">
            <div className="sw h"></div> Hard <span className="v">29</span>
          </div>
        </div>
      </div>
    </div>
  );
}
