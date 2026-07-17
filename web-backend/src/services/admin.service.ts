// Admin data access — users, logins, sessions, overview KPIs. See /admin/plan.md §3.
//
// ⚠️ Admin queries must run OUTSIDE the per-user RLS scope (a dedicated admin DB path / service
//    role). This is the one place RLS is intentionally bypassed — gate tightly and audit fully.
//
// TODO: implement each method (Prisma), calling auditService.writeAudit on mutations.

export const AdminService = {
  // overview():           Promise<AdminOverview>   — KPIs, health, revenue
  // listUsers(query):     Promise<PagedUsers>
  // getUser(id):          Promise<AdminUserDetail>
  // suspendUser(id, r):   Promise<void>
  // revokeSessions(id):   Promise<void>
  // deleteUser(id):       Promise<void>            — GDPR soft-delete -> purge
  // recentLogins(query):  Promise<PagedLogins>
  // audit(query):         Promise<PagedAudit>
};
