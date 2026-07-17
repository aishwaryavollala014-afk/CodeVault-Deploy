// Immutable admin audit log. See /admin/plan.md §3.2. Every admin request + sensitive mutation
// (payment refund, user suspend, flag toggle) is recorded here.
//
// TODO: implement writeAudit() -> prisma.auditLog.create({ data: entry }). Never mutate/delete.

export interface AuditEntry {
  actorId: string; // admin user id
  action: string; // e.g. "payment.refund" | "user.suspend" | "flag.toggle"
  targetType?: string; // "user" | "payment" | ...
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

export async function writeAudit(_entry: AuditEntry): Promise<void> {
  // TODO: persist to the AuditLog table.
}
