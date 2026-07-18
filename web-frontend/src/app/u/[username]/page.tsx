"use client";

import React, { useState, use, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlatformChip } from "@/components/PlatformChip";
import { FollowListModal } from "@/components/FollowListModal";
import { apiFetch } from "@/utils/api";
import { PLATFORMS, PLATFORM_ORDER } from "@/constants/platforms";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type PlatformStat = { total?: number; easy?: number; medium?: number; hard?: number; rating?: number; heatmap?: any };
type PublicData = {
  user?: { handle?: string; displayName?: string | null; avatarUrl?: string | null };
  stats?: { totalSolved?: number; platforms?: Record<string, PlatformStat> };
  social?: { followerCount: number; followingCount: number; isFollowing: boolean; isSelf: boolean };
};

// Platforms in display order (id/name/color come from the shared constant).
const PLATFORM_META = PLATFORM_ORDER.map((id) => PLATFORMS[id]);

const fmt = (n: number | undefined | null) => (typeof n === "number" ? n.toLocaleString() : "—");

export default function PublicProfileView({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username || "gaurav";
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<PublicData | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  // Optimistic local follow state (seeded from the API response).
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [listModal, setListModal] = useState<null | "followers" | "following">(null);

  // Fetch the public profile from web-backend. Cookies included so the
  // response is personalised (isFollowing / isSelf) for signed-in viewers.
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/public/${username}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        setData(d);
        if (d?.social) {
          setIsFollowing(d.social.isFollowing);
          setFollowerCount(d.social.followerCount);
        }
      })
      .catch(() => {});
    setSignedIn(!!localStorage.getItem("user"));
    return () => { alive = false; };
  }, [username]);

  const toggleFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);

    const wasFollowing = isFollowing;
    // Optimistic flip — update UI immediately.
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));

    try {
      const res = await apiFetch(`/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) {
        console.warn("Follow API returned", res.status);
        setIsFollowing(wasFollowing);
        setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
      }
    } catch (err) {
      console.warn("Follow request failed:", err);
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
    } finally {
      setFollowBusy(false);
    }
  };

  const openMessages = () => {
    if (!signedIn) { router.push("/login"); return; }
    router.push(`/messages?with=${encodeURIComponent(username)}`);
  };

  const platforms = data?.stats?.platforms || {};
  const lc = platforms.leetcode;
  const totalSolved = data?.stats?.totalSolved;
  const platformCount = Object.keys(platforms).length;
  const maxTotal = Math.max(1, ...PLATFORM_META.map((p) => platforms[p.id]?.total || 0));
  const displayName = data?.user?.displayName || username;
  const hasLcData = lc && typeof lc.total === "number" && lc.total > 0;
  const hasAnyData = typeof totalSolved === "number" && totalSolved > 0;
  const connectedPlatforms = PLATFORM_META.filter((p) => platforms[p.id]);

  // Compute actual conic-gradient angles for the difficulty ring
  const ringGradient = useMemo(() => {
    if (!lc || !lc.total) return "conic-gradient(var(--border) 0% 100%)";
    const total = lc.total;
    const easy = ((lc.easy || 0) / total) * 100;
    const medium = ((lc.medium || 0) / total) * 100;
    const hard = ((lc.hard || 0) / total) * 100;
    return `conic-gradient(var(--amber) 0% ${easy}%, var(--brand) ${easy}% ${easy + medium}%, var(--rose) ${easy + medium}% ${easy + medium + hard}%)`;
  }, [lc]);

  // Aggregate heatmap from all connected platforms
  const heatmapCells = useMemo(() => {
    const mergedHeatmap: Record<string, number> = {};
    
    Object.keys(platforms).forEach((pKey) => {
      const p = platforms[pKey];
      if (p.heatmap) {
        const pHeatmap = typeof p.heatmap === 'string' ? JSON.parse(p.heatmap) : p.heatmap;
        Object.entries(pHeatmap).forEach(([ts, count]) => {
          const dateStr = new Date(parseInt(ts) * 1000).toISOString().split('T')[0];
          mergedHeatmap[dateStr] = (mergedHeatmap[dateStr] || 0) + (count as number);
        });
      }
    });

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
    return cells;
  }, [platforms]);

  const hasHeatmapActivity = heatmapCells.some((c) => c !== "");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://codevault.dev/u/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  const initial = (displayName || username).charAt(0).toUpperCase();

  // Build topic strengths from real data (aggregated across platforms)
  const topicStrengths = useMemo(() => {
    const topicMap: Record<string, number> = {};
    // We don't have topic data in the public API yet, so return empty.
    // When the API exposes problem topics, this will aggregate them.
    return Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, []);

  return (
    <>
      {/* SVG sprite inline references */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <symbol id="ic-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></symbol>
      </svg>

      {/* Sticky nav */}
      <div className="nav" style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(248,246,241,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
        <div className="nav-in" style={{ maxWidth: "920px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", padding: "0 24px" }}>
          <Link className="brand" href="/">
            <span className="mark">CV</span> CodeVault
          </Link>
          <Link className="btn btn-primary" href="/login">
            Build your own profile
          </Link>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: "920px", margin: "28px auto 60px", padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* ── Hero Header ─────────────────────────────────────────── */}
        <section className="phead">
          <div className="phead-top">
            <div className="pav">
              {data?.user?.avatarUrl
                ? <img src={data.user.avatarUrl} alt={displayName} />
                : initial
              }
            </div>
            <div className="pid">
              <h1>{displayName}</h1>
              <div className="ln">codevault.dev/u/{username}</div>

              {data?.social && (
                <div className="social-row">
                  <button onClick={() => setListModal("followers")} type="button">
                    <b>{followerCount.toLocaleString()}</b> Followers
                  </button>
                  <span aria-hidden="true" style={{ color: "var(--border-2)" }}>·</span>
                  <button onClick={() => setListModal("following")} type="button">
                    <b>{data.social.followingCount.toLocaleString()}</b> Following
                  </button>
                </div>
              )}

              {connectedPlatforms.length > 0 && (
                <div className="chips">
                  {connectedPlatforms.map((p) => (
                    <span className="pchip" key={p.id}>
                      <PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" /> {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="phead-actions">
            {/* Show Follow + Message for other users' profiles (not your own) */}
            {!(data?.social?.isSelf) && (
              <>
                <button
                  className="btn"
                  type="button"
                  onClick={toggleFollow}
                  disabled={followBusy}
                  style={isFollowing
                    ? { background: "#fff", color: "var(--ink)", border: "1px solid var(--border-2)", transition: "all .2s" }
                    : { background: "var(--brand)", color: "#fff", border: "1px solid var(--brand)", transition: "all .2s" }
                  }
                >
                  {isFollowing ? "Following ✓" : "+ Follow"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={openMessages}>
                  <svg className="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><polyline points="3.5 7 12 13 20.5 7"/></svg>
                  Message
                </button>
              </>
            )}
            <button className="btn btn-secondary" type="button" onClick={handleCopyLink}>
              <svg className="ico sm" aria-hidden="true"><use href="#ic-copy"/></svg> {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a className="btn btn-secondary" href={`https://github.com/${username}/LeetCodeQuestions`} target="_blank" rel="noopener noreferrer">View solutions ↗</a>
          </div>
        </section>

        {listModal && (
          <FollowListModal handle={username} initialTab={listModal} onClose={() => setListModal(null)} />
        )}

        {/* ── Stats Cards ─────────────────────────────────────────── */}
        <section className="stats">
          <div className="stat">
            <div className="l"><span className="stat-icon fire">🔥</span> Total solved</div>
            <div className="n">{hasAnyData ? fmt(totalSolved) : "—"}</div>
            {hasAnyData && <div className="d">across all platforms</div>}
          </div>
          <div className="stat">
            <div className="l"><span className="stat-icon code">⚡</span> Platforms</div>
            <div className="n">{data ? platformCount : "—"}</div>
            {platformCount > 0 && <div className="d warm">connected</div>}
          </div>
          {hasLcData ? (
            <>
              <div className="stat">
                <div className="l"><span className="stat-icon bolt">💪</span> Hard solved</div>
                <div className="n">{fmt(lc?.hard)}</div>
                <div className="d pink">LeetCode</div>
              </div>
              <div className="stat">
                <div className="l"><span className="stat-icon star">✅</span> LeetCode</div>
                <div className="n">{fmt(lc?.total)}</div>
                <div className="d">problems solved</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat">
                <div className="l"><span className="stat-icon bolt">💪</span> Hard solved</div>
                <div className="n">—</div>
              </div>
              <div className="stat">
                <div className="l"><span className="stat-icon star">✅</span> LeetCode</div>
                <div className="n">—</div>
              </div>
            </>
          )}
        </section>

        {/* ── Difficulty + Platform Breakdown ──────────────────────── */}
        <div className="grid g-2">
          <section className="panel">
            <h2>Difficulty</h2>
            {hasLcData ? (
              <div className="ringwrap">
                <div className="ring" role="img" aria-label={`${lc?.easy || 0} Easy, ${lc?.medium || 0} Medium, ${lc?.hard || 0} Hard`} style={{ background: ringGradient }}>
                  <div className="rc"><b>{fmt(lc?.total)}</b><span>solved</span></div>
                </div>
                <div className="rleg">
                  <div className="r"><span className="sw e"></span> Easy <span className="v">{fmt(lc?.easy)}</span></div>
                  <div className="r"><span className="sw m"></span> Medium <span className="v">{fmt(lc?.medium)}</span></div>
                  <div className="r"><span className="sw h"></span> Hard <span className="v">{fmt(lc?.hard)}</span></div>
                </div>
              </div>
            ) : (
              <div className="prof-empty">
                <span className="emoji">📊</span>
                Connect LeetCode to see difficulty breakdown
                <span className="hint">Easy · Medium · Hard split</span>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>By platform</h2>
            {connectedPlatforms.length > 0 ? (
              <div className="pf">
                {connectedPlatforms.map((p) => {
                  const t = platforms[p.id]?.total || 0;
                  return (
                    <div className="pf-row" key={p.id}>
                      <span className="lab"><PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" />{p.name}</span>
                      <span className="pf-bar"><i style={{ width: `${Math.max(4, (t / maxTotal) * 100)}%`, background: p.color }}></i></span>
                      <span className="val">{fmt(t)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="prof-empty">
                <span className="emoji">🔗</span>
                No platforms connected yet
                <span className="hint">When {displayName} connects LeetCode, Codeforces, or others, stats will appear here.</span>
              </div>
            )}
          </section>
        </div>

        {/* ── Submission Activity Heatmap ──────────────────────────── */}
        <section className="panel">
          <h2>Submission activity · last 12 months</h2>
          {hasHeatmapActivity ? (
            <>
              <div className="heat" role="img" aria-label="Submission activity heatmap" aria-hidden="true">
                {heatmapCells.map((cls, idx) => (
                  <i key={idx} className={cls || undefined}></i>
                ))}
              </div>
              <div className="heat-legend">
                Less <i style={{ background: "#efe7df" }}></i><i className="l1"></i><i className="l2"></i><i className="l3"></i><i className="l4"></i> More
              </div>
            </>
          ) : (
            <div className="prof-empty">
              <span className="emoji">📅</span>
              No submission activity yet
              <span className="hint">Activity will appear here once problems are solved</span>
            </div>
          )}
        </section>

        {/* ── Topic Strengths (only if real data exists) ───────────── */}
        {topicStrengths.length > 0 && (
          <section className="panel">
            <h2>Topic strengths</h2>
            <div className="chips2">
              {topicStrengths.map(([topic, count]) => (
                <span className="tchip" key={topic}>{topic} <b>{count}</b></span>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer CTA ──────────────────────────────────────────── */}
        <div className="cta-card">
          <strong>Turn your practice into a profile like this</strong>
          <p>Connect your accounts and CodeVault builds it automatically.</p>
          <Link className="btn btn-primary" href="/login">Get started free</Link>
        </div>
      </div>
    </>
  );
}
