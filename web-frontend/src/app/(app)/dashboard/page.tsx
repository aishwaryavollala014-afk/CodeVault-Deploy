"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlatformChip } from "@/components/PlatformChip";

// Build the public problem URL from a submission's platform + titleSlug.
function problemUrl(sub: { platform?: string; titleSlug?: string }): string | null {
  const slug = sub.titleSlug;
  if (!slug) return null;
  switch (sub.platform) {
    case "leetcode":
      return `https://leetcode.com/problems/${slug}/`;
    case "codeforces": {
      // titleSlug is "<contestId>-<index>"
      const [contestId, index] = slug.split("-");
      return contestId && index
        ? `https://codeforces.com/contest/${contestId}/problem/${index}`
        : "https://codeforces.com/problemset";
    }
    case "codechef":
      return `https://www.codechef.com/problems/${slug}`;
    case "hackerrank":
      return `https://www.hackerrank.com/challenges/${slug}/problem`;
    default:
      return null;
  }
}

// dd/mm/yyyy
function formatDate(tsSeconds: number): string {
  return new Date(tsSeconds * 1000).toLocaleDateString("en-GB");
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [heatmapCells, setHeatmapCells] = useState<string[]>([]);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

    const fetchStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          
          // Merge Heatmap
          const mergedHeatmap: Record<string, number> = {};
          let allRecent: any[] = [];
          
          Object.keys(data?.platforms || {}).forEach((pKey) => {
            const p = data.platforms[pKey];
            
            // Heatmap
            if (p.heatmap) {
              const pHeatmap = typeof p.heatmap === 'string' ? JSON.parse(p.heatmap) : p.heatmap;
              Object.entries(pHeatmap).forEach(([ts, count]) => {
                const dateStr = new Date(parseInt(ts) * 1000).toISOString().split('T')[0];
                mergedHeatmap[dateStr] = (mergedHeatmap[dateStr] || 0) + (count as number);
              });
            }
            
            // Recent
            if (p.recent) {
              const recents = p.recent.map((r: any) => ({
                ...r,
                platform: pKey
              }));
              allRecent = allRecent.concat(recents);
            }
          });
          
          // Generate 365 cells
          const cells = [];
          const today = new Date();
          for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const count = mergedHeatmap[dStr] || 0;
            
            if (count >= 5) cells.push("l4");
            else if (count >= 3) cells.push("l3");
            else if (count >= 2) cells.push("l2");
            else if (count >= 1) cells.push("l1");
            else cells.push("");
          }
          setHeatmapCells(cells);
          
          // Sort recent
          allRecent.sort((a, b) => b.timestamp - a.timestamp);
          setRecentSubs(allRecent.slice(0, 15));
          
        } else if (res.status === 404) {
          router.push("/connect");
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const handleCopyLink = () => {
    if (user) {
      navigator.clipboard.writeText(`http://localhost:3000/u/${user.githubLogin}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !user) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--faint)" }}>Loading your data...</div>;
  }

  return (
    <>
      {/* PROFILE HEADER */}
      <section className="phead">
        <div className="pav">{user.displayName?.charAt(0).toUpperCase() || user.githubLogin.charAt(0).toUpperCase()}</div>
        <div className="pid">
          <div className="nm">{user.displayName || user.githubLogin}</div>
          <div className="ln">codevault.dev/u/{user.githubLogin}</div>
          <div className="chips">
            {Object.keys(stats?.platforms || {}).map(platformId => {
              if (!stats.platforms[platformId]) return null;
              return (
                <span className="pchip" key={platformId}>
                  <PlatformChip platformId={platformId} size="sm" showName={false} variant="ghost" /> {platformId}
                </span>
              );
            })}
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
          <div className="n">{stats?.totalSolved?.toLocaleString() || "0"}</div>
          <div className="d">across all platforms</div>
        </div>
        {stats?.platforms?.leetcode && (
          <div className="stat">
            <div className="l"><PlatformChip platformId="leetcode" size="sm" showName={false} variant="ghost" /> LeetCode</div>
            <div className="n">{stats.platforms.leetcode.total?.toLocaleString() || "0"}</div>
            <div className="d">problems solved</div>
          </div>
        )}
        {stats?.platforms?.codeforces && (
          <div className="stat">
            <div className="l"><PlatformChip platformId="codeforces" size="sm" showName={false} variant="ghost" /> Codeforces</div>
            <div className="n">{stats.platforms.codeforces.total?.toLocaleString() || "0"}</div>
            <div className="d">problems solved</div>
          </div>
        )}
        {stats?.platforms?.codechef && (
          <div className="stat">
            <div className="l"><PlatformChip platformId="codechef" size="sm" showName={false} variant="ghost" /> CodeChef</div>
            <div className="n">{stats.platforms.codechef.total?.toLocaleString() || "0"}</div>
            <div className="d">problems solved</div>
          </div>
        )}
        {stats?.platforms?.codechef?.rating && (
          <div className="stat">
            <div className="l"><PlatformChip platformId="codechef" size="sm" showName={false} variant="ghost" /> CodeChef Rating</div>
            <div className="n">{stats.platforms.codechef.rating.toLocaleString()}</div>
            <div className="d">
              <span style={{ color: "#e8a200" }}>{"★".repeat(stats.platforms.codechef.stars || 0)}</span>
              {stats.platforms.codechef.highestRating ? ` · peak ${stats.platforms.codechef.highestRating}` : ""}
              {stats.platforms.codechef.globalRank ? ` · #${stats.platforms.codechef.globalRank.toLocaleString()} global` : ""}
            </div>
          </div>
        )}
        {stats?.platforms?.hackerrank && (
          <div className="stat">
            <div className="l"><PlatformChip platformId="hackerrank" size="sm" showName={false} variant="ghost" /> HackerRank</div>
            <div className="n">{stats.platforms.hackerrank.total?.toLocaleString() || "0"}</div>
            <div className="d">problems solved</div>
          </div>
        )}
      </section>

      {/* ROW: ring + heatmap + platforms */}
      <div className="grid g-3">
        {/* LeetCode-style difficulty ring (only if LeetCode connected) */}
        {stats?.platforms?.leetcode ? (
          <section className="panel">
            <h2 className="h">Difficulty <span className="tag">LeetCode</span></h2>
            <div className="ringwrap">
              <div className="ring" role="img" aria-label="Difficulty breakdown">
                <div className="rc"><b>{stats.platforms.leetcode.total?.toLocaleString() || "0"}</b><span>solved</span></div>
              </div>
              <div className="rleg">
                <div className="r"><span className="sw e"></span> Easy <span className="v">{stats.platforms.leetcode.easy || 0}</span></div>
                <div className="r"><span className="sw m"></span> Medium <span className="v">{stats.platforms.leetcode.medium || 0}</span></div>
                <div className="r"><span className="sw h"></span> Hard <span className="v">{stats.platforms.leetcode.hard || 0}</span></div>
              </div>
            </div>
          </section>
        ) : (
          <section className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', minHeight: 200, flexDirection: 'column' }}>
            <svg className="ico mb-2" aria-hidden="true" style={{ width: 32, height: 32, opacity: 0.5 }}><use href="#ic-plus"/></svg>
            <p style={{ fontSize: 14 }}>Connect LeetCode for difficulty breakdown</p>
          </section>
        )}

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
            {Object.keys(stats?.platforms || {}).map(platformId => {
              const pData = stats.platforms[platformId];
              if (!pData || !pData.total) return null;
              
              const platformConfig: Record<string, { name: string, color: string }> = {
                leetcode: { name: 'LeetCode', color: '#ffa116' },
                codeforces: { name: 'Codeforces', color: '#1f8acb' },
                codechef: { name: 'CodeChef', color: '#7a5230' },
                hackerrank: { name: 'HackerRank', color: '#1aa260' }
              };
              
              const config = platformConfig[platformId];
              if (!config) return null;
              
              const width = Math.min(100, Math.max(1, (pData.total / (stats.totalSolved || 1)) * 100));

              return (
                <div className="pf-row" key={platformId}>
                  <span className="lab"><PlatformChip platformId={platformId} size="sm" showName={false} variant="ghost" />{config.name}</span>
                  <span className="pf-bar"><i style={{ width: `${width}%`, background: config.color }}></i></span>
                  <span className="val">{pData.total.toLocaleString()}</span>
                </div>
              );
            })}
            
            {(!stats?.platforms || Object.keys(stats.platforms).length === 0) && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                No platforms connected yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Codeforces-style recent submissions table */}
      <section className="panel">
        <h2 className="h">Recent accepted submissions <span className="tag">across all platforms</span></h2>
        {recentSubs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No recent submissions found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Problem</th>
                <th scope="col">Source</th>
                <th scope="col">Rating/Diff</th>
                <th scope="col">Verdict</th>
                <th scope="col" className="tright">When</th>
              </tr>
            </thead>
            <tbody>
              {recentSubs.map((sub, i) => {
                const url = problemUrl(sub);
                return (
                  <tr key={i}>
                    <td className="prob-name">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" title="Open problem ↗" style={{ color: "inherit", textDecoration: "none" }}
                           onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                           onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}>
                          {sub.title}
                        </a>
                      ) : (
                        sub.title
                      )}
                    </td>
                    <td>
                      <span className="src">
                        <PlatformChip platformId={sub.platform} size="sm" showName={false} variant="ghost" />
                        <span style={{ textTransform: 'capitalize' }}>{sub.platform}</span>
                      </span>
                    </td>
                    <td>
                      {sub.rating ? (
                        <span className="pill-d rate">{sub.rating}</span>
                      ) : (
                        <span className="pill-d med" style={{ opacity: 0.5 }}>-</span>
                      )}
                    </td>
                    <td className="verd">Accepted</td>
                    <td className="tright">{formatDate(sub.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
