// Admin — immutable audit log. See /admin/plan.md §3.2 & §7.
// TODO: fetch GET /api/admin/audit ; actor, action, target, IP, time; filter + export.
export default function AdminAuditPage() {
  return (
    <section>
      <h1 style={{ margin: 0 }}>Audit log</h1>
      <p style={{ color: "#6b7280" }}>Every admin action, immutable. Not implemented — see admin/plan.md §3.2.</p>
    </section>
  );
}
