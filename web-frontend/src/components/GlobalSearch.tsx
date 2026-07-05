"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Searchable destinations inside CodeVault (pages, settings sections, platforms).
const TARGETS: { label: string; href: string; keys: string[] }[] = [
  { label: "Overview / Dashboard", href: "/dashboard", keys: ["overview", "dashboard", "home", "stats", "problems"] },
  { label: "Repositories", href: "/repositories", keys: ["repo", "repositories", "github", "sync repo"] },
  { label: "Analytics", href: "/analytics", keys: ["analytics", "charts", "rating", "language", "difficulty"] },
  { label: "Public profile", href: "/public-profile", keys: ["public", "profile", "share"] },
  { label: "Sync status", href: "/sync-status", keys: ["sync", "status", "activity", "push"] },
  { label: "Settings", href: "/settings", keys: ["settings", "account", "github", "platforms", "notifications", "appearance", "theme"] },
  { label: "Connect a platform", href: "/connect", keys: ["connect", "add", "platform", "leetcode", "codeforces", "codechef", "hackerrank"] },
];

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const query = q.trim().toLowerCase();
  const results = query
    ? TARGETS.filter((t) => t.label.toLowerCase().includes(query) || t.keys.some((k) => k.includes(query)))
    : [];

  const go = (href: string) => { setQ(""); setOpen(false); router.push(href); };

  return (
    <div className="search" style={{ position: "relative" }}>
      <svg className="ico sm"><use href="#ic-search" /></svg>
      <input
        type="text"
        placeholder="Search settings, pages, platforms…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) go(results[0].href); }}
      />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.1)", zIndex: 50, overflow: "hidden" }}>
          {results.map((r) => (
            <button
              key={r.href}
              type="button"
              onMouseDown={() => go(r.href)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--paper)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
