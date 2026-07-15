"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type ListUser = { id: string; handle: string; displayName?: string | null; avatarUrl?: string | null };
type Tab = "followers" | "following";

/**
 * Modal listing a profile's followers / following, opened from the counts
 * on /u/[username]. Styled to match the app's white rounded cards.
 */
export function FollowListModal({
  handle,
  initialTab,
  onClose,
}: {
  handle: string;
  initialTab: Tab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [users, setUsers] = useState<ListUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const load = useCallback((which: Tab, cursor?: string | null) => {
    setLoading(true);
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    fetch(`${API_URL}/users/${handle}/${which}${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setUsers((prev) => (cursor ? [...prev, ...(d.users || [])] : d.users || []));
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [handle]);

  useEffect(() => {
    setUsers([]);
    setNextCursor(null);
    load(tab);
  }, [tab, load]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(26,22,15,.45)", zIndex: 100, display: "grid", placeItems: "center", padding: 20 }}
      role="dialog"
      aria-modal="true"
      aria-label={tab === "followers" ? "Followers" : "Following"}
    >
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,.18)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "70vh" }}>
        {/* Header: tabs + close */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div className="seg">
            <button className={tab === "followers" ? "on" : ""} onClick={() => setTab("followers")}>Followers</button>
            <button className={tab === "following" ? "on" : ""} onClick={() => setTab("following")}>Following</button>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border-2)", background: "#fff", cursor: "pointer", color: "var(--muted)", fontSize: 15, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* User list */}
        <div style={{ overflowY: "auto" }}>
          {users.length === 0 && !loading && (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
              {tab === "followers" ? "No followers yet." : "Not following anyone yet."}
            </div>
          )}
          {users.map((u) => (
            <Link
              key={u.id}
              href={`/u/${u.handle}`}
              onClick={onClose}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--border)" }}
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt="" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }} />
              ) : (
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,var(--brand),var(--rose))", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flex: "none" }}>
                  {u.handle.charAt(0).toUpperCase()}
                </span>
              )}
              <span style={{ minWidth: 0 }}>
                <b style={{ display: "block", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.displayName || u.handle}</b>
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>@{u.handle}</span>
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 600, color: "var(--brand-d)" }}>View →</span>
            </Link>
          ))}
          {loading && (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>Loading…</div>
          )}
          {nextCursor && !loading && (
            <button
              className="btn"
              onClick={() => load(tab, nextCursor)}
              style={{ margin: "10px auto 14px", display: "block", padding: "8px 16px", fontSize: 13, border: "1px solid var(--border-2)", background: "#fff" }}
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
