"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [heatmapCells, setHeatmapCells] = useState<string[]>([]);

  useEffect(() => {
    // Check if the user is logged in
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

  // Seeded deterministic heatmap generator (exactly matches overview.html script)
  useEffect(() => {
    const lv = ["", "l1", "l2", "l3", "l4"];
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const cells = [];
    for (let i = 0; i < 53 * 7; i++) {
      const r = rand();
      const recent = i > 53 * 7 * 0.62;
      let l = 0;
      if (r > 0.5) l = 1;
      if (r > 0.7) l = 2;
      if (r > 0.85) l = 3;
      if (r > 0.93 || (recent && r > 0.72)) l = 4;
      cells.push(lv[l]);
    }
    setHeatmapCells(cells);
  }, []);

  const handleCopyLink = () => {
    if (!user) return;
    navigator.clipboard.writeText(`https://codevault.dev/u/${user.githubLogin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>;
  }

  const initial = (user.displayName || user.githubLogin).charAt(0).toUpperCase();

  return (
    <>
      {/* PROFILE HEADER */}
      <section className="phead">
        <div className="pav">{initial}</div>
        <div className="pid">
          <div className="nm">{user.displayName || user.githubLogin}</div>
          <div className="ln">codevault.dev/u/{user.githubLogin}</div>
          <div className="chips">
            <span className="pchip"><span className="b lc">LC</span> LeetCode <span className="h">@{user.githubLogin}</span></span>
            <span className="pchip"><span className="b cf">CF</span> Codeforces <span className="h">@{user.githubLogin}_t</span></span>
            <span className="pchip"><span className="b cc">CC</span> CodeChef <span className="h">@{user.githubLogin}06</span></span>
            <span className="pchip"><span className="b hr">HR</span> HackerRank <span className="h">@{user.githubLogin}g</span></span>
          </div>
        </div>
        <div className="pa">
          <button className="btn" type="button" onClick={handleCopyLink}>
            <svg className="ico sm" aria-hidden="true"><use href="#ic-copy"/></svg>
            {copied ? "Copied ✓" : "Copy profile link"}
          </button>
          <Link href="/connect" className="btn brand">
            <svg className="ico sm" aria-hidden="true"><use href="#ic-plus"/></svg> Connect platform
          </Link>
        </div>
      </section>

      {/* STAT ROW */}
      <section className="stats" aria-label="Key stats">
        <div className="stat">
          <div className="l"><svg className="ico sm" aria-hidden="true"><use href="#ic-analytics"/></svg> Total solved</div>
          <div className="n">1,248</div>
          <div className="d">+37 this week</div>
        </div>
        <div className="stat">
          <div className="l"><svg className="ico sm a" aria-hidden="true"><use href="#ic-flame"/></svg> Current streak</div>
          <div className="n">47 days</div>
          <div className="d warm">Longest 89 days</div>
        </div>
        <div className="stat">
          <div className="l"><svg className="ico sm r" aria-hidden="true"><use href="#ic-bolt"/></svg> Codeforces rating</div>
          <div className="n">1,623</div>
          <div className="d pink">Peak 1,711</div>
        </div>
        <div className="stat">
          <div className="l"><svg className="ico sm" aria-hidden="true"><use href="#ic-github"/></svg> Synced to GitHub</div>
          <div className="n">1,190</div>
          <div className="d">95% of solved</div>
        </div>
      </section>

      {/* ROW: ring + heatmap + platforms */}
      <div className="grid g-3">
        {/* LeetCode-style difficulty ring */}
        <section className="panel">
          <h2 className="h">Difficulty <span className="tag">solved</span></h2>
          <div className="ringwrap">
            <div className="ring" role="img" aria-label="Difficulty breakdown: 540 Easy, 560 Medium, 148 Hard, 1248 total">
              <div className="rc"><b>1,248</b><span>solved</span></div>
            </div>
            <div className="rleg">
              <div className="r"><span className="sw e"></span> Easy <span className="v">540</span></div>
              <div className="r"><span className="sw m"></span> Medium <span className="v">560</span></div>
              <div className="r"><span className="sw h"></span> Hard <span className="v">148</span></div>
            </div>
          </div>
        </section>

        {/* GitHub-style heatmap */}
        <section className="panel">
          <h2 className="h">Submission activity <span className="tag">last 12 months</span></h2>
          <div className="heat" role="img" aria-label="Submission heatmap over the last 12 months" aria-hidden="true">
            {heatmapCells.map((cls, i) => (
              <i key={i} className={cls || undefined}></i>
            ))}
          </div>
          <div className="heat-legend">
            Less <i style={{ background: "#efe7df" }}></i>
            <i style={{ background: "#fbd6c6" }}></i>
            <i style={{ background: "#f5a888" }}></i>
            <i style={{ background: "#f0764f" }}></i>
            <i style={{ background: "#d8431f" }}></i> More
          </div>
        </section>

        {/* platform breakdown */}
        <section className="panel">
          <h2 className="h">By platform</h2>
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

      {/* ROW: topics + HackerRank badges */}
      <div className="grid g-2">
        <section className="panel">
          <h2 className="h">Topic strengths</h2>
          <div className="chips2">
            <span className="tchip">Arrays <b>210</b></span>
            <span className="tchip">Dynamic Programming <b>142</b></span>
            <span className="tchip">Graphs <b>118</b></span>
            <span className="tchip">Trees <b>96</b></span>
            <span className="tchip">Greedy <b>84</b></span>
            <span className="tchip">Binary Search <b>71</b></span>
            <span className="tchip">Strings <b>63</b></span>
            <span className="tchip">Math <b>58</b></span>
            <span className="tchip">Sliding Window <b>44</b></span>
          </div>
        </section>

        <section className="panel">
          <h2 className="h">Skill badges</h2>
          <div className="badges">
            <div className="bdg">
              <div className="hex">DSA</div>
              <div className="bt">
                <div className="n">Problem Solving</div>
                <div className="m">Gold · 1,248 solved</div>
              </div>
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
            </div>
            <div className="bdg">
              <div className="hex a">DP</div>
              <div className="bt">
                <div className="n">Dynamic Programming</div>
                <div className="m">Silver · 142 solved</div>
              </div>
              <div className="stars" aria-label="4 out of 5 stars">★★★★☆</div>
            </div>
            <div className="bdg">
              <div className="hex r">GR</div>
              <div className="bt">
                <div className="n">Graphs</div>
                <div className="m">Silver · 118 solved</div>
              </div>
              <div className="stars" aria-label="4 out of 5 stars">★★★★☆</div>
            </div>
          </div>
        </section>
      </div>

      {/* Codeforces-style recent submissions table */}
      <section className="panel">
        <h2 className="h">Recent accepted submissions <span className="tag">auto-synced to GitHub</span></h2>
        <table>
          <thead>
            <tr>
              <th scope="col">Problem</th>
              <th scope="col">Source</th>
              <th scope="col">Difficulty</th>
              <th scope="col">Verdict</th>
              <th scope="col">Synced</th>
              <th scope="col" className="tright">When</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="prob-name">369 · Plus One Linked List</td>
              <td><span className="src"><span className="badge-ic lc">LC</span>LeetCode</span></td>
              <td><span className="pill-d med">Medium</span></td>
              <td className="verd">Accepted</td>
              <td><Link className="gh-link" href="/repositories">0369/solution.py</Link></td>
              <td className="tright">2h ago</td>
            </tr>
            <tr>
              <td className="prob-name">Dijkstra: Shortest Reach 2</td>
              <td><span className="src"><span className="badge-ic hr">HR</span>HackerRank</span></td>
              <td><span className="pill-d hard">Hard</span></td>
              <td className="verd">Accepted</td>
              <td><Link className="gh-link" href="/repositories">dijkstra/solution.cpp</Link></td>
              <td className="tright">5h ago</td>
            </tr>
            <tr>
              <td className="prob-name">Edu Round 168 — C</td>
              <td><span className="src"><span className="badge-ic cf">CF</span>Codeforces</span></td>
              <td><span className="pill-d rate">1400</span></td>
              <td className="verd">Accepted</td>
              <td><Link className="gh-link" href="/repositories">1968C/solution.cpp</Link></td>
              <td className="tright">yesterday</td>
            </tr>
            <tr>
              <td className="prob-name">Chef and Subarrays</td>
              <td><span className="src"><span className="badge-ic cc">CC</span>CodeChef</span></td>
              <td><span className="pill-d easy">Easy</span></td>
              <td className="verd">Accepted</td>
              <td><Link className="gh-link" href="/repositories">SUBARR/solution.py</Link></td>
              <td className="tright">yesterday</td>
            </tr>
            <tr>
              <td className="prob-name">704 · Binary Search</td>
              <td><span className="src"><span className="badge-ic lc">LC</span>LeetCode</span></td>
              <td><span className="pill-d easy">Easy</span></td>
              <td className="verd">Accepted</td>
              <td><Link className="gh-link" href="/repositories">0704/solution.java</Link></td>
              <td className="tright">2 days ago</td>
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}
