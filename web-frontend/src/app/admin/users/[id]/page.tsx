// Admin — user detail + actions (suspend, revoke sessions, delete). See /admin/plan.md §3.1.
// TODO: fetch GET /api/admin/users/:id ; show profile, connections, repos, sync history,
// plan/subscription, recent logins; wire the (audited, confirm+reason) action buttons.
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <section>
      <h1 style={{ margin: 0 }}>User {id}</h1>
      <p style={{ color: "#6b7280" }}>Detail + actions. Not implemented — see admin/plan.md §3.1.</p>
    </section>
  );
}
