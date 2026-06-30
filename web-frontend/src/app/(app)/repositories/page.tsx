"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RepositoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);

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
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading repositories...</div>;
  }

  return (
    <>
      <section className="panel">
        <div className="repohead">
          <div className="ghmark"><svg viewBox="0 0 24 24"><use href="#ic-github"/></svg></div>
          <div>
            <div className="nm">{user.githubLogin} / <a href="#">LeetCodeQuestions</a> <span className="pubpill">Public</span></div>
            <div className="meta"><span>default branch <b>main</b></span><span>612 files</span><span>last sync 2h ago</span><span>auto-sync on</span></div>
          </div>
          <div className="acts">
            <a className="btn" href={`https://github.com/${user.githubLogin}/LeetCodeQuestions`} target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>
            <Link className="btn brand" href="/sync-status">
              <svg className="ico sm" aria-hidden="true"><use href="#ic-sync"/></svg> Re-sync now
            </Link>
          </div>
        </div>
      </section>

      <div className="grid g-2">
        <section className="panel">
          <h2 className="h">Files <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--faint)" }}>LeetCodeQuestions/</span></h2>
          <div className="fl">
            <div className="fl-bar">
              <svg className="ico sm" aria-hidden="true"><use href="#ic-repos"/></svg> main · 612 problems
            </div>
            <div className="fl-row" style={{ cursor: "pointer" }}>
              <span className="nm"><span className="fold">▸</span> 0001 · Two Sum</span>
              <span className="lang">solution.py</span>
              <span className="when">3 mo ago</span>
            </div>
            <div className="fl-row" style={{ cursor: "pointer" }}>
              <span className="nm"><span className="fold">▸</span> 0011 · Container With Most Water</span>
              <span className="lang">solution.cpp</span>
              <span className="when">3 mo ago</span>
            </div>
            <div className="fl-row" style={{ cursor: "pointer" }}>
              <span className="nm"><span className="fold">▸</span> 0369 · Plus One Linked List</span>
              <span className="lang">solution.py</span>
              <span className="when">2h ago</span>
            </div>
            <div className="fl-row" style={{ cursor: "pointer" }}>
              <span className="nm"><span className="fold">▸</span> 0704 · Binary Search</span>
              <span className="lang">solution.java</span>
              <span className="when">2d ago</span>
            </div>
            <div className="fl-row" style={{ cursor: "pointer" }}>
              <span className="nm"><span className="fold">▸</span> 1143 · Longest Common Subsequence</span>
              <span className="lang">solution.cpp</span>
              <span className="when">1w ago</span>
            </div>
            <div className="fl-row" style={{ cursor: "pointer" }}>
              <span className="nm">README.md</span>
              <span className="lang" style={{ background: "var(--brand-soft)", color: "var(--brand-d)" }}>index</span>
              <span className="when">2h ago</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="h">Recent commits</h2>
          <div className="commits">
            <div className="commit"><span className="sha">a1f3c9</span><span className="msg">Add 0369 · Plus One Linked List</span><span className="when">2h</span></div>
            <div className="commit"><span className="sha">7b2e10</span><span className="msg">Update README index (612 problems)</span><span className="when">2h</span></div>
            <div className="commit"><span className="sha">c98da4</span><span className="msg">Add 0704 · Binary Search</span><span className="when">2d</span></div>
            <div className="commit"><span className="sha">3de5f0</span><span className="msg">Add 1143 · Longest Common Subsequence</span><span className="when">1w</span></div>
            <div className="commit"><span className="sha">e4419b</span><span className="msg">Add 0011 · Container With Most Water</span><span className="when">3mo</span></div>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2 className="h">Repository mapping <span style={{ fontWeight: 500, color: "var(--faint)", fontSize: "12px" }}>one repo per platform</span></h2>
        <div className="map">
          <div className="map-row">
            <span className="badge-ic lc">LC</span> LeetCode <span className="arrow">→</span> <span className="repo">LeetCodeQuestions</span>
            <Link className="btn" href="/settings">Configure</Link>
          </div>
          <div className="map-row">
            <span className="badge-ic cf">CF</span> Codeforces <span className="arrow">→</span> <span className="repo">CodeforcesSolutions</span>
            <Link className="btn" href="/settings">Configure</Link>
          </div>
          <div className="map-row">
            <span className="badge-ic cc">CC</span> CodeChef <span className="arrow">→</span> <span className="repo">CodeChef-Solutions</span>
            <Link className="btn" href="/settings">Configure</Link>
          </div>
          <div className="map-row">
            <span className="badge-ic hr">HR</span> HackerRank <span className="arrow">→</span> <span className="repo">HackerRank</span>
            <Link className="btn" href="/settings">Configure</Link>
          </div>
        </div>
      </section>
    </>
  );
}
