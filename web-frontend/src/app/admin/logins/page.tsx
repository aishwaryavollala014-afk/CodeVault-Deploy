// Admin — login & session activity. See /admin/plan.md §3.2 & §7.
// TODO: fetch GET /api/admin/logins ; timestamp, method, IP, UA, success/failure; revoke sessions.
export default function AdminLoginsPage() {
  return (
    <section>
      <h1 style={{ margin: 0 }}>Logins &amp; sessions</h1>
      <p style={{ color: "#6b7280" }}>Login activity + active sessions. Not implemented — see admin/plan.md §3.2.</p>
    </section>
  );
}
