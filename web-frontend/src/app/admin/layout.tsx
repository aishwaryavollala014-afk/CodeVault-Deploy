// Admin route-group layout + access guard. See /admin/plan.md §2 & §7.
//
// TODO (security, before shipping): replace the placeholder check below with a real
// owner-admin verification (session -> DB role === 'admin' AND githubLogin in ADMIN allowlist).
// On failure call notFound() so /admin returns 404 (do NOT reveal the route exists).
// Skeleton renders a visible warning banner so it's obvious this is NOT secured yet.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#faf7f2", color: "#1a160f", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#dc2626", color: "#fff", padding: "8px 16px", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
        ⚠ ADMIN CONSOLE — SKELETON. Access control NOT implemented (see admin/plan.md §2). Do not deploy as-is.
      </div>
      <div style={{ display: "flex" }}>
        <nav style={{ width: 200, padding: 16, borderRight: "1px solid #ecece4", fontSize: 13 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>🔐 Admin</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            <li><a href="/admin">Overview</a></li>
            <li><a href="/admin/users">Users</a></li>
            <li><a href="/admin/logins">Logins &amp; sessions</a></li>
            <li><a href="/admin/audit">Audit log</a></li>
            <li><a href="/admin/payments">Payments</a></li>
            <li><a href="/admin/moderation">Moderation</a></li>
          </ul>
        </nav>
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}
