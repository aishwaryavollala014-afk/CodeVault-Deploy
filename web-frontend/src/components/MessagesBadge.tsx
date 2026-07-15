"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Red unread-count pill for the sidebar "Messages" item.
 * Polls /messages/unread-count and refreshes instantly when the messages
 * page signals a read via the `cv:refresh-messages` window event.
 */
export function MessagesBadge() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch(`${API_URL}/messages/unread-count`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setUnread(d.unread || 0); })
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    window.addEventListener("cv:refresh-messages", load);
    return () => { clearInterval(id); window.removeEventListener("cv:refresh-messages", load); };
  }, []);

  if (unread === 0) return null;
  return (
    <span style={{ marginLeft: "auto", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "var(--brand)", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "grid", placeItems: "center" }}>
      {unread > 9 ? "9+" : unread}
    </span>
  );
}
