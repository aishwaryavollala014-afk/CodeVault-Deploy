"use client";

import { useEffect, useState } from "react";

type Overview = {
  users: number;
  admins: number;
  activeSubscriptions: number;
  payments: number;
  problemsSynced: number;
  syncRuns: number;
  revenueMinor: number;
};

const card: React.CSSProperties = { background: "#fff", border: "1px solid #ecece4", borderRadius: 14, padding: 18 };

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Overview) => { setData(d); setState("ok"); })
      .catch(() => setState("denied"));
  }, []);

  if (state === "denied") return <AccessDenied />;
  if (!data) return <p style={{ color: "#6b7280" }}>Loading…</p>;

  const kpis: [string, string][] = [
    ["Total users", data.users.toLocaleString()],
    ["Admins", data.admins.toLocaleString()],
    ["Active subscriptions", data.activeSubscriptions.toLocaleString()],
    ["Payments", data.payments.toLocaleString()],
    ["Revenue", `₹${(data.revenueMinor / 100).toLocaleString()}`],
    ["Problems synced", data.problemsSynced.toLocaleString()],
    ["Sync runs", data.syncRuns.toLocaleString()],
  ];

  return (
    <section>
      <h1 style={{ margin: "0 0 4px" }}>Overview</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>System KPIs across users, billing, and sync.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginTop: 18 }}>
        {kpis.map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AccessDenied() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#6b7280" }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <h2 style={{ color: "#1a160f" }}>Access denied</h2>
      <p>This console is restricted to CodeVault owners. Sign in to the main app first.</p>
      <a href="http://localhost:3000/login" style={{ color: "#f1543f", fontWeight: 600 }}>Go to sign-in →</a>
    </div>
  );
}
