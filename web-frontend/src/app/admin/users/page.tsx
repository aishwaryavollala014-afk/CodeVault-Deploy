// Admin — users list & search. See /admin/plan.md §3.1 & §7.
// TODO: fetch GET /api/admin/users?query=&cursor= ; paginated table; link to /admin/users/[id].
export default function AdminUsersPage() {
  return (
    <section>
      <h1 style={{ margin: 0 }}>Users</h1>
      <p style={{ color: "#6b7280" }}>Search, view, suspend, revoke sessions, GDPR delete. Not implemented — see admin/plan.md §3.1.</p>
    </section>
  );
}
