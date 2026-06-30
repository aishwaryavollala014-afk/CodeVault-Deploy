"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);
  const [activePlatform, setActivePlatform] = useState("All");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to parse user data", e);
    }
  }, [router]);

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading analytics...</div>;
  }

  return (
    <>
      <div className="filters">
        <div className="seg" role="tablist" aria-label="Platform filter">
          {["All", "LeetCode", "Codeforces", "CodeChef", "HackerRank"].map((plat) => (
            <button
              key={plat}
              type="button"
              className={activePlatform === plat ? "on" : ""}
              onClick={() => setActivePlatform(plat)}
            >
              {plat}
            </button>
          ))}
        </div>
        <span className="spacer"></span>
        <select aria-label="Time range">
          <option>Last 12 months</option>
          <option>Last 6 months</option>
          <option>All time</option>
        </select>
      </div>

      <section className="stats" aria-label="Headline analytics">
        <div className="stat">
          <div className="l">Acceptance rate</div>
          <div className="n">71.4%</div>
          <div className="d">1,248 AC / 1,748 tries</div>
        </div>
        <div className="stat">
          <div className="l">Avg. problems / day</div>
          <div className="n">3.4</div>
          <div className="d">last 90 days</div>
        </div>
        <div className="stat">
          <div className="l">Active days</div>
          <div className="n">284</div>
          <div className="d">of last 365</div>
        </div>
        <div className="stat">
          <div className="l">Best CF rating</div>
          <div className="n">1,711</div>
          <div className="d">current 1,623</div>
        </div>
      </section>

      <section className="panel">
        <h2 className="h">Problems solved per month <span className="tag">2025–2026</span></h2>
        <div className="mbars">
          {[
            { m: "Jul", v: 42, h: "30%" },
            { m: "Aug", v: 55, h: "38%" },
            { m: "Sep", v: 67, h: "46%" },
            { m: "Oct", v: 58, h: "40%" },
            { m: "Nov", v: 80, h: "55%" },
            { m: "Dec", v: 91, h: "62%" },
            { m: "Jan", v: 104, h: "72%" },
            { m: "Feb", v: 96, h: "66%" },
            { m: "Mar", v: 112, h: "78%" },
            { m: "Apr", v: 121, h: "84%" },
            { m: "May", v: 133, h: "92%" },
            { m: "Jun", v: 147, h: "100%" },
          ].map((bar) => (
            <div key={bar.m} className="col">
              <div className="bar" style={{ height: bar.h }}>
                <span>{bar.v}</span>
              </div>
              <div className="lbl">{bar.m}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid g-2">
        <section className="panel">
          <h2 className="h">Difficulty mix</h2>
          <div className="ringwrap">
            <div className="ring" role="img" aria-label="540 Easy, 560 Medium, 148 Hard">
              <div className="rc"><b>1,248</b><span>solved</span></div>
            </div>
            <div className="rleg">
              <div className="r"><span className="sw e"></span> Easy <span className="v">540 · 43%</span></div>
              <div className="r"><span className="sw m"></span> Medium <span className="v">560 · 45%</span></div>
              <div className="r"><span className="sw h"></span> Hard <span className="v">148 · 12%</span></div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="h">Languages used</h2>
          <div className="hb">
            <div className="hb-row">
              <span className="lab"><span className="dot" style={{ background: "var(--brand)" }}></span>Python</span>
              <span className="hb-bar"><i style={{ width: "100%", background: "var(--brand)" }}></i></span>
              <span className="v">540</span>
            </div>
            <div className="hb-row">
              <span className="lab"><span className="dot" style={{ background: "var(--amber)" }}></span>C++</span>
              <span className="hb-bar"><i style={{ width: "76%", background: "var(--amber)" }}></i></span>
              <span className="v">410</span>
            </div>
            <div className="hb-row">
              <span className="lab"><span className="dot" style={{ background: "var(--rose)" }}></span>Java</span>
              <span className="hb-bar"><i style={{ width: "37%", background: "var(--rose)" }}></i></span>
              <span className="v">198</span>
            </div>
            <div className="hb-row">
              <span className="lab"><span className="dot" style={{ background: "#8a8378" }}></span>JavaScript</span>
              <span className="hb-bar"><i style={{ width: "18%", background: "#8a8378" }}></i></span>
              <span className="v">100</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid g-2">
        <section className="panel">
          <h2 className="h">Topic distribution</h2>
          <div className="hb">
            <div className="hb-row"><span className="lab">Arrays</span><span className="hb-bar"><i style={{ width: "100%", background: "var(--brand)" }}></i></span><span className="v">210</span></div>
            <div className="hb-row"><span className="lab">Dynamic Prog.</span><span className="hb-bar"><i style={{ width: "68%", background: "var(--brand)" }}></i></span><span className="v">142</span></div>
            <div className="hb-row"><span className="lab">Graphs</span><span className="hb-bar"><i style={{ width: "56%", background: "var(--amber)" }}></i></span><span className="v">118</span></div>
            <div className="hb-row"><span className="lab">Trees</span><span className="hb-bar"><i style={{ width: "46%", background: "var(--amber)" }}></i></span><span className="v">96</span></div>
            <div className="hb-row"><span className="lab">Greedy</span><span className="hb-bar"><i style={{ width: "40%", background: "var(--rose)" }}></i></span><span className="v">84</span></div>
            <div className="hb-row"><span className="lab">Binary Search</span><span className="hb-bar"><i style={{ width: "34%", background: "var(--rose)" }}></i></span><span className="v">71</span></div>
          </div>
        </section>

        <section className="panel">
          <h2 className="h">Codeforces rating <span className="tag">peak 1,711</span></h2>
          <svg className="spark" viewBox="0 0 320 120" preserveAspectRatio="none" role="img" aria-label="Codeforces rating trend rising to 1623">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f1543f" stopOpacity="0.25"/>
                <stop offset="1" stopColor="#f1543f" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,95 L40,88 L80,92 L120,70 L160,74 L200,52 L240,40 L280,46 L320,28 L320,120 L0,120 Z" fill="url(#g)"/>
            <path d="M0,95 L40,88 L80,92 L120,70 L160,74 L200,52 L240,40 L280,46 L320,28" fill="none" stroke="#f1543f" strokeWidth="2.5" strokeLinejoin="round"/>
            <circle cx="320" cy="28" r="3.5" fill="#f1543f"/>
          </svg>
        </section>
      </div>
    </>
  );
}
