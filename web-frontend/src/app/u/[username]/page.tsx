"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";

export default function PublicProfileView({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username || "gaurav";
  const [copied, setCopied] = useState(false);
  const [heatmapCells, setHeatmapCells] = useState<string[]>([]);

  useEffect(() => {
    // Generate heatmap cells
    const lv = ["", "l1", "l2", "l3", "l4"];
    let s = 1337;
    const r = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const cells = [];
    for (let i = 0; i < 53 * 7; i++) {
      const v = r();
      const rec = i > 53 * 7 * 0.62;
      let l = 0;
      if (v > 0.5) l = 1;
      if (v > 0.7) l = 2;
      if (v > 0.85) l = 3;
      if (v > 0.93 || (rec && v > 0.72)) l = 4;
      cells.push(lv[l]);
    }
    setHeatmapCells(cells);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://codevault.dev/u/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  const initial = username.charAt(0).toUpperCase();

  return (
    <>
      {/* SVG sprite inline references (copied from overview) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <symbol id="ic-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></symbol>
      </svg>

      <div className="nav" style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(248,246,241,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
        <div className="nav-in" style={{ maxWidth: "920px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", padding: "0 24px" }}>
          <Link className="brand" href="/">
            <span className="mark">CV</span> CodeVault
          </Link>
          <Link className="btn brand" href="/login">
            Build your own profile
          </Link>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: "920px", margin: "28px auto 60px", padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <section className="phead" style={{ padding: "26px", borderRadius: "18px" }}>
          <div className="pav" style={{ width: "80px", height: "80px", borderRadius: "20px", fontSize: "34px" }}>{initial}</div>
          <div className="pid">
            <h1 style={{ fontSize: "24px" }}>{username}</h1>
            <div className="ln">codevault.dev/u/{username}</div>
            <div className="chips" style={{ marginTop: "12px" }}>
              <span className="pchip"><span className="b lc">LC</span> @{username}</span>
              <span className="pchip"><span className="b cf">CF</span> @{username}_t</span>
              <span className="pchip"><span className="b cc">CC</span> @{username}06</span>
              <span className="pchip"><span className="b hr">HR</span> @{username}g</span>
            </div>
          </div>
          <div className="pa">
            <button className="btn" type="button" onClick={handleCopyLink}>
              <svg className="ico sm" aria-hidden="true"><use href="#ic-copy"/></svg> {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a className="btn" href={`https://github.com/${username}/LeetCodeQuestions`} target="_blank" rel="noopener noreferrer">View solutions ↗</a>
          </div>
        </section>

        <section className="stats">
          <div className="stat"><div className="n">1,248</div><div className="l">Total solved</div></div>
          <div className="stat"><div className="n">4</div><div className="l">Platforms</div></div>
          <div className="stat"><div className="n">148</div><div className="l">Hard solved</div></div>
          <div className="stat"><div className="n">89</div><div className="l">Best streak</div></div>
        </section>

        <div className="grid g-2">
          <section className="panel">
            <h2>Difficulty</h2>
            <div className="ringwrap">
              <div className="ring" role="img" aria-label="540 Easy, 560 Medium, 148 Hard">
                <div className="rc"><b>1,248</b><span>solved</span></div>
              </div>
              <div className="rleg">
                <div className="r"><span className="sw e"></span> Easy <span className="v">540</span></div>
                <div className="r"><span className="sw m"></span> Medium <span className="v">560</span></div>
                <div className="r"><span className="sw h"></span> Hard <span className="v">148</span></div>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>By platform</h2>
            <div className="pf">
              <div className="pf-row">
                <span className="lab"><span className="badge-ic lc">LC</span>LeetCode</span>
                <span className="pf-bar"><i style={{ width: "100%", background: "#ffa116" }}></i></span>
                <span className="val">612</span>
              </div>
              <div className="pf-row">
                <span className="lab"><span className="badge-ic cf">CF</span>Codeforces</span>
                <span className="pf-bar"><i style={{ width: "56%", background: "#1f8acb" }}></i></span>
                <span className="val">341</span>
              </div>
              <div className="pf-row">
                <span className="lab"><span className="badge-ic cc">CC</span>CodeChef</span>
                <span className="pf-bar"><i style={{ width: "30%", background: "#7a5230" }}></i></span>
                <span className="val">184</span>
              </div>
              <div className="pf-row">
                <span className="lab"><span className="badge-ic hr">HR</span>HackerRank</span>
                <span className="pf-bar"><i style={{ width: "18%", background: "#1aa260" }}></i></span>
                <span className="val">111</span>
              </div>
            </div>
          </section>
        </div>

        <section className="panel">
          <h2>Submission activity · last 12 months</h2>
          <div className="heat" role="img" aria-label="Submission activity heatmap" aria-hidden="true">
            {heatmapCells.map((cls, idx) => (
              <i key={idx} className={cls || undefined}></i>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Topic strengths</h2>
          <div className="chips2">
            <span className="tchip">Arrays <b>210</b></span>
            <span className="tchip">Dynamic Programming <b>142</b></span>
            <span className="tchip">Graphs <b>118</b></span>
            <span className="tchip">Trees <b>96</b></span>
            <span className="tchip">Greedy <b>84</b></span>
            <span className="tchip">Binary Search <b>71</b></span>
            <span className="tchip">Strings <b>63</b></span>
            <span className="tchip">Math <b>58</b></span>
          </div>
        </section>

        <div className="cta-foot">
          <strong>Turn your practice into a profile like this</strong>
          <p>Connect your accounts and CodeVault builds it automatically.</p>
          <Link className="btn brand" href="/login">Get started free</Link>
        </div>
      </div>
    </>
  );
}
