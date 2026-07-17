// Admin overview — KPIs, system health, revenue, feature flags. See /admin/plan.md §3.4 & §7.
// TODO: fetch GET /api/admin/overview and render KPI cards + kill switches.
export default function AdminOverviewPage() {
  return (
    <section>
      <h1 style={{ margin: 0 }}>Overview</h1>
      <p style={{ color: "#6b7280" }}>KPIs, system health, revenue, and feature flags. Not implemented — see admin/plan.md §3.4.</p>
    </section>
  );
}
