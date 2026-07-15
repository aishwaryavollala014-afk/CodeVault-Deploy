"use client";

import React, { useState, use, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlatformChip } from "@/components/PlatformChip";
import { FollowListModal } from "@/components/FollowListModal";
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
    if (!signedIn) { router.push("/login"); return; }
    if (followBusy) return;
    setFollowBusy(true);
    // Optimistic flip; roll back on failure.
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));
    try {
      const res = await fetch(`${API_URL}/users/${username}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
    } catch {
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
  const hardSolved = lc?.hard;
  const maxTotal = Math.max(1, ...PLATFORM_META.map((p) => platforms[p.id]?.total || 0));
  const displayName = data?.user?.displayName || username;

  const heatmapCells = useMemo(() => {
    const mergedHeatmap: Record<string, number> = {};
    
    // Aggregate from all connected platforms
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
            <h1 style={{ fontSize: "24px" }}>{displayName}</h1>
            <div className="ln">codevault.dev/u/{username}</div>
            {data?.social && (
              <div style={{ display: "flex", gap: 14, marginTop: 7, fontSize: 13, color: "var(--muted)" }}>
                <button
                  onClick={() => setListModal("followers")}
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
                >
                  <b style={{ color: "var(--ink)" }}>{followerCount.toLocaleString()}</b> Followers
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setListModal("following")}
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
                >
                  <b style={{ color: "var(--ink)" }}>{data.social.followingCount.toLocaleString()}</b> Following
                </button>
              </div>
            )}
            <div className="chips" style={{ marginTop: "12px" }}>
              {PLATFORM_META.filter((p) => platforms[p.id]).map((p) => (
                <span className="pchip" key={p.id}>
                  <PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" /> {p.name}
                </span>
              ))}
            </div>
          </div>
          <div className="pa">
            {data?.social && !data.social.isSelf && (
              <>
                <button
                  className="btn"
                  type="button"
                  onClick={toggleFollow}
                  disabled={followBusy}
                  style={isFollowing
                    ? { background: "#fff", color: "var(--ink)", borderColor: "var(--border-2)" }
                    : { background: "var(--brand)", color: "#fff", borderColor: "var(--brand)" }}
                >
                  {isFollowing ? "Following ✓" : "+ Follow"}
                </button>
                <button className="btn" type="button" onClick={openMessages}>
                  <svg className="ico sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><polyline points="3.5 7 12 13 20.5 7"/></svg>
                  Message
                </button>
              </>
            )}
            <button className="btn" type="button" onClick={handleCopyLink}>
              <svg className="ico sm" aria-hidden="true"><use href="#ic-copy"/></svg> {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a className="btn" href={`https://github.com/${username}/LeetCodeQuestions`} target="_blank" rel="noopener noreferrer">View solutions ↗</a>
          </div>
        </section>

        {listModal && (
          <FollowListModal handle={username} initialTab={listModal} onClose={() => setListModal(null)} />
        )}

        <section className="stats">
          <div className="stat"><div className="n">{fmt(totalSolved)}</div><div className="l">Total solved</div></div>
          <div className="stat"><div className="n">{data ? platformCount : "—"}</div><div className="l">Platforms</div></div>
          <div className="stat"><div className="n">{fmt(hardSolved)}</div><div className="l">Hard solved (LC)</div></div>
          <div className="stat"><div className="n">{fmt(lc?.total)}</div><div className="l">LeetCode solved</div></div>
        </section>

        <div className="grid g-2">
          <section className="panel">
            <h2>Difficulty</h2>
            <div className="ringwrap">
              <div className="ring" role="img" aria-label={`${lc?.easy || 0} Easy, ${lc?.medium || 0} Medium, ${lc?.hard || 0} Hard`}>
                <div className="rc"><b>{fmt(lc?.total)}</b><span>solved</span></div>
              </div>
              <div className="rleg">
                <div className="r"><span className="sw e"></span> Easy <span className="v">{fmt(lc?.easy)}</span></div>
                <div className="r"><span className="sw m"></span> Medium <span className="v">{fmt(lc?.medium)}</span></div>
                <div className="r"><span className="sw h"></span> Hard <span className="v">{fmt(lc?.hard)}</span></div>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>By platform</h2>
            <div className="pf">
              {PLATFORM_META.filter((p) => platforms[p.id]).map((p) => {
                const t = platforms[p.id]?.total || 0;
                return (
                  <div className="pf-row" key={p.id}>
                    <span className="lab"><PlatformChip platformId={p.id} size="sm" showName={false} variant="ghost" />{p.name}</span>
                    <span className="pf-bar"><i style={{ width: `${Math.max(4, (t / maxTotal) * 100)}%`, background: p.color }}></i></span>
                    <span className="val">{fmt(t)}</span>
                  </div>
                );
              })}
              {data && platformCount === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No platforms connected yet.</p>
              )}
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
