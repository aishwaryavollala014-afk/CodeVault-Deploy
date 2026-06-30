"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PublicProfileSettings() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; githubLogin: string; displayName: string | null } | null>(null);
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
  }, [router]);

  const handleCopy = () => {
    if (!user) return;
    navigator.clipboard.writeText(`https://codevault.dev/u/${user.githubLogin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1300);
  };

  if (!user) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Loading settings...</div>;
  }

  const username = user.githubLogin;
  const initial = username.charAt(0).toUpperCase();

  return (
    <>
      <section className="panel full">
        <h2 className="h">
          Your public link <span className="live"><span className="pulse"></span> Live</span>
        </h2>
        <div className="urlrow">
          <span className="url">codevault.dev/u/{username}</span>
          <button className="btn" type="button" onClick={handleCopy}>
            <svg className="ico sm" aria-hidden="true"><use href="#ic-copy"/></svg> {copied ? "Copied ✓" : "Copy"}
          </button>
          <a className="btn" href={`/u/${username}`} target="_blank" rel="noopener noreferrer">Open ↗</a>
          <label className="switch">
            <input type="checkbox" defaultChecked aria-label="Public profile enabled" />
            <span className="sl"></span>
          </label>
        </div>
        <div className="share">
          <button className="btn" type="button">Share on X</button>
          <button className="btn" type="button">Share on LinkedIn</button>
          <button className="btn" type="button">Add to résumé</button>
        </div>
      </section>

      <section className="panel">
        <h2 className="h">What's visible</h2>
        {[
          { n: "Total solved", m: "Headline count across platforms", c: true },
          { n: "Difficulty breakdown", m: "Easy / Medium / Hard split", c: true },
          { n: "Topic strengths", m: "Tags and counts", c: true },
          { n: "Submission heatmap", m: "Activity over the last year", c: true },
          { n: "Platform handles", m: "Link to your profiles", c: true },
          { n: "Codeforces rating", m: "Current and peak", c: false },
        ].map((opt, i) => (
          <div key={i} className="opt">
            <div className="ot">
              <div className="n">{opt.n}</div>
              <div className="m">{opt.m}</div>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked={opt.c} />
              <span className="sl"></span>
            </label>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2 className="h">Live preview</h2>
        <div className="pcard">
          <div className="pc-top">
            <div className="pc-av">{initial}</div>
            <div className="pc-id">
              <div className="nm">{username}</div>
              <div className="ln">codevault.dev/u/{username}</div>
            </div>
          </div>
          <div className="pc-stats">
            <div className="st"><div className="n">1,248</div><div className="l">Solved</div></div>
            <div className="st"><div className="n">4</div><div className="l">Platforms</div></div>
            <div className="st"><div className="n">148</div><div className="l">Hard</div></div>
            <div className="st"><div className="n">89</div><div className="l">Best streak</div></div>
          </div>
          <div className="pc-foot">
            <span className="pchip"><span className="b lc">LC</span> 612</span>
            <span className="pchip"><span className="b cf">CF</span> 341</span>
            <span className="pchip"><span className="b cc">CC</span> 184</span>
            <span className="pchip"><span className="b hr">HR</span> 111</span>
          </div>
        </div>
      </section>
    </>
  );
}
