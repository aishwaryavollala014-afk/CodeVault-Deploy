"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlatformChip } from "@/components/PlatformChip";
import { CodeVaultLoader } from "@/components/CodeVaultLoader";
import { PLATFORMS, problemUrlFor } from "@/constants/platforms";

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
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const platformDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(e.target as Node)) {
        setIsPlatformDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract all tags from recentSubs
  const availableTags = useMemo(() => {
    const counts: Record<string, number> = {};
    recentSubs.forEach(sub => {
      let subTags: string[] = [];
      if (sub.topicTags) {
        subTags = sub.topicTags.map((t: any) => t.name.toUpperCase());
      } else if (sub.tags) {
        subTags = sub.tags.map((t: string) => t.toUpperCase());
      }
      // deduplicate tags for a single submission
      const uniqueSubTags = Array.from(new Set(subTags));
      uniqueSubTags.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [recentSubs]);

  const VISIBLE_COUNT = 15;
  const filteredSubs = recentSubs.filter((sub) => {
    // 1. Text search
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (sub.title || "").toLowerCase().includes(q) || (sub.titleSlug || "").toLowerCase().includes(q);
    
    // 2. Tag filter
    let matchesTags = true;
    if (selectedTags.length > 0) {
      let subTags: string[] = [];
      if (sub.topicTags) subTags = sub.topicTags.map((t: any) => t.name.toUpperCase());
      else if (sub.tags) subTags = sub.tags.map((t: string) => t.toUpperCase());
      
      matchesTags = selectedTags.some(tag => subTags.includes(tag));
    }

    // 3. Platform filter
    let matchesPlatform = true;
    if (selectedPlatforms.length > 0) {
      matchesPlatform = selectedPlatforms.includes((sub.platform || "").toLowerCase());
    }

    return matchesSearch && matchesTags && matchesPlatform;
  });

  const visibleSubs = showAllSubs || searchQuery.trim() || selectedTags.length > 0 || selectedPlatforms.length > 0 ? filteredSubs : filteredSubs.slice(0, VISIBLE_COUNT);
  const hasMore = !searchQuery.trim() && selectedTags.length === 0 && selectedPlatforms.length === 0 && filteredSubs.length > VISIBLE_COUNT;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
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
          credentials: 'include'
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

          // Manual fallback: also count problems captured by the extension (git-service),
          // so platforms whose stats API returns no calendar still show activity on the map.
          try {
            const GIT_URL = process.env.NEXT_PUBLIC_GIT_SERVICE_URL || 'http://localhost:5050/api';
            const pRes = await fetch(`${GIT_URL}/problems?limit=100`, {
              credentials: 'include',
            });
            if (pRes.ok) {
              const pData = await pRes.json();
              (pData?.items || []).forEach((it: any) => {
                if (!it?.solvedAt) return;
                const dateStr = new Date(it.solvedAt).toISOString().split('T')[0];
                mergedHeatmap[dateStr] = (mergedHeatmap[dateStr] || 0) + 1;
              });
            }
          } catch {
            /* git-service optional — heatmap still works from stats alone */
          }

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
          setRecentSubs(allRecent);
          
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
    return <CodeVaultLoader text="Loading your dashboard" />;
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
              
              const config = PLATFORMS[platformId];
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "4px" }}>
          <h2 className="h" style={{ margin: 0 }}>Recent accepted submissions <span className="tag">across all platforms</span></h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1", minWidth: "220px", maxWidth: "600px", justifyContent: "flex-end" }}>
            
            {/* Platform Dropdown */}
            <div ref={platformDropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 12px",
                  border: "1px solid var(--border, #e0dcd6)",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontFamily: "inherit",
                  background: "var(--subtle, #f9f7f4)",
                  color: "var(--ink, #1a1a1a)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  outline: "none",
                  transition: "border-color .2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent, #d8431f)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border, #e0dcd6)"; }}
              >
                Platforms {selectedPlatforms.length > 0 && <span style={{ background: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "11px" }}>{selectedPlatforms.length}</span>}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isPlatformDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
              </button>

              {isPlatformDropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  width: "180px",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}>
                  <div style={{ padding: "6px", maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {[
                    ...(stats?.platforms?.leetcode ? [{ value: "leetcode", label: "LeetCode" }] : []),
                    ...(stats?.platforms?.codeforces ? [{ value: "codeforces", label: "Codeforces" }] : []),
                    ...(stats?.platforms?.codechef ? [{ value: "codechef", label: "CodeChef" }] : []),
                    ...(stats?.platforms?.hackerrank ? [{ value: "hackerrank", label: "HackerRank" }] : [])
                  ].map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        cursor: "pointer",
                        borderRadius: "6px",
                        fontSize: "13.5px",
                        transition: "background .2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--subtle, #f9f7f4)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPlatforms([...selectedPlatforms, option.value]);
                          else setSelectedPlatforms(selectedPlatforms.filter(p => p !== option.value));
                          setShowAllSubs(false);
                        }}
                        style={{ margin: 0, cursor: "pointer", accentColor: "var(--accent)" }}
                      />
                      {option.label}
                    </label>
                  ))}
                  </div>
                  {selectedPlatforms.length > 0 && (
                    <div style={{ padding: "6px 8px", borderTop: "1px solid var(--border)", background: "var(--subtle, #f9f7f4)" }}>
                      <button
                        type="button"
                        onClick={() => { setSelectedPlatforms([]); setShowAllSubs(false); }}
                        style={{ width: "100%", background: "transparent", border: "none", color: "var(--accent)", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Tag Dropdown */}
            {availableTags.length > 0 && (
              <div ref={tagDropdownRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 12px",
                    border: "1px solid var(--border, #e0dcd6)",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontFamily: "inherit",
                    background: "var(--subtle, #f9f7f4)",
                    color: "var(--ink, #1a1a1a)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    outline: "none",
                    transition: "border-color .2s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent, #d8431f)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border, #e0dcd6)"; }}
                >
                  Recent Tags {selectedTags.length > 0 && <span style={{ background: "var(--accent)", color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "11px" }}>{selectedTags.length}</span>}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isTagDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                
                {isTagDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    width: "260px",
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "300px"
                  }}>
                    <div style={{ padding: "8px", borderBottom: "1px solid var(--border)" }}>
                      <input
                        type="text"
                        placeholder="Search recent tags..."
                        value={tagSearchQuery}
                        onChange={e => setTagSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "none",
                          outline: "none",
                          fontSize: "13px",
                          fontFamily: "inherit",
                          background: "var(--subtle, #f9f7f4)",
                          borderRadius: "6px",
                          color: "var(--ink)"
                        }}
                      />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1, padding: "4px", display: "flex", flexDirection: "column" }}>
                      {availableTags
                        .filter(t => t.name.includes(tagSearchQuery.toUpperCase()))
                        .map(tag => (
                          <label key={tag.name} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "var(--ink)",
                            borderRadius: "6px"
                          }}
                          onMouseOver={e => e.currentTarget.style.background = "var(--subtle, #f9f7f4)"}
                          onMouseOut={e => e.currentTarget.style.background = "transparent"}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag.name)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTags([...selectedTags, tag.name]);
                                else setSelectedTags(selectedTags.filter(t => t !== tag.name));
                                setShowAllSubs(false);
                              }}
                              style={{ accentColor: "var(--accent)" }}
                            />
                            <span style={{ flex: 1 }}>{tag.name}</span>
                            <span style={{ color: "var(--muted)", fontSize: "12px" }}>({tag.count})</span>
                          </label>
                        ))}
                      {availableTags.filter(t => t.name.includes(tagSearchQuery.toUpperCase())).length === 0 && 
                        <div style={{ padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>No tags match</div>}
                    </div>
                    <div style={{ padding: "6px 8px", fontSize: "11px", color: "var(--muted)", borderTop: "1px solid var(--border)", textAlign: "center", background: "var(--subtle, #f9f7f4)", borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px" }}>
                      Tags compiled from your recent submissions
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ position: "relative", flex: "1" }}>
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--ink-2, #888)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search problems…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowAllSubs(false); }}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  border: "1px solid var(--border, #e0dcd6)",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontFamily: "inherit",
                  background: "var(--subtle, #f9f7f4)",
                  color: "var(--ink, #1a1a1a)",
                  outline: "none",
                  transition: "border-color .2s, box-shadow .2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent, #d8431f)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(216,67,31,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border, #e0dcd6)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>
        </div>
        {filteredSubs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            {(searchQuery.trim() || selectedTags.length > 0) ? `No problems found.` : "No recent submissions found."}
          </div>
        ) : (
          <>
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
                {visibleSubs.map((sub, i) => {
                  const url = problemUrlFor(sub.platform, sub.titleSlug);
                  const date = new Date(sub.timestamp * 1000);
                  return (
                    <tr key={i}>
                      <td className="prob-name">
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" title="Open problem ↗" style={{ color: "inherit", textDecoration: "none" }}
                             onMouseOver={(e) => (e.currentTarget.style.color = "var(--brand)")}
                             onMouseOut={(e) => (e.currentTarget.style.color = "inherit")}>
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
                      <td className="tright">{`${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {hasMore && (
              <button
                type="button"
                onClick={() => setShowAllSubs((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  width: "100%",
                  padding: "12px 0",
                  marginTop: "4px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: "13.5px",
                  color: "var(--ink-2)",
                  transition: "all .2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "var(--subtle, #f5f3ef)";
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--ink-2)";
                }}
              >
                {showAllSubs
                  ? `Show less`
                  : `Show all ${recentSubs.length} problems`}
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    transition: "transform .2s ease",
                    transform: showAllSubs ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}
