"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type Notif = { id: string; type: string; title: string; body?: string | null; readAt?: string | null; createdAt: string };

function ago(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiFetch(`${API_URL}/notifications`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setItems(d.items || []); setUnread(d.unread || 0); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // poll every 15s for near-instant notification delivery
    // Allow other components to trigger an immediate refresh (e.g. after manual sync).
    const onRefresh = () => load();
    window.addEventListener("cv:refresh-notifications", onRefresh);
    return () => { clearInterval(id); window.removeEventListener("cv:refresh-notifications", onRefresh); };
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await apiFetch(`${API_URL}/notifications/read-all`, { method: "POST", credentials: 'include' }).catch(() => {});
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="ic-btn" title="Notifications" onClick={toggle} style={{ position: "relative" }}>
        <svg className="ico"><use href="#ic-bell" /></svg>
        {unread > 0 && (
          <span style={{ position: "absolute", top: 0, right: 0, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "var(--brand)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, maxHeight: 400, overflowY: "auto", background: "#fff", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.12)", zIndex: 60 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14 }}>Notifications</div>
          {items.length === 0 ? (
            <div style={{ padding: "28px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No notifications yet.</div>
          ) : (
            items.map((n) => (
              <div key={n.id} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: n.readAt ? "none" : "var(--paper)" }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{n.body}</div>}
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>{ago(n.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
