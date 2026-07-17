"use client";

import { useEffect, useState } from "react";
import { AccessDenied } from "../page";

type AdminUser = {
  id: string;
  githubLogin: string | null;
  handle: string;
  displayName: string | null;
  email: string | null;
  role: string;
  plan: string;
  createdAt: string;
};

export default function UsersPage() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  const load = (query: string) => {
    fetch(`/api/users?query=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { items: AdminUser[] }) => { setItems(d.items); setState("ok"); })
      .catch(() => setState("denied"));
  };

  useEffect(() => load(""), []);

  if (state === "denied") return <AccessDenied />;

  return (
    <section>
      <h1 style={{ margin: "0 0 4px" }}>Users</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>All users — search by login, handle, email, or name.</p>
      <form onSubmit={(e) => { e.preventDefault(); load(q); }} style={{ display: "flex", gap: 8, margin: "14px 0" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users…"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1px solid #ecece4", fontSize: 13 }}
        />
        <button type="submit" style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#f1543f", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Search
        </button>
      </form>
      <div style={{ background: "#fff", border: "1px solid #ecece4", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b7280", background: "#faf7f2" }}>
              <th style={{ padding: "10px 14px" }}>User</th>
              <th style={{ padding: "10px 14px" }}>Email</th>
              <th style={{ padding: "10px 14px" }}>Role</th>
              <th style={{ padding: "10px 14px" }}>Plan</th>
              <th style={{ padding: "10px 14px" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {state === "loading" ? (
              <tr><td colSpan={5} style={{ padding: 18, color: "#6b7280" }}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 18, color: "#6b7280" }}>No users found.</td></tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #f0eee8" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontWeight: 600 }}>{u.displayName || u.githubLogin || u.handle}</span>
                    <div style={{ color: "#9c9a8e", fontSize: 11 }}>@{u.githubLogin || u.handle}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>{u.email || "—"}</td>
                  <td style={{ padding: "10px 14px" }}>{u.role}</td>
                  <td style={{ padding: "10px 14px" }}>{u.plan}</td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
