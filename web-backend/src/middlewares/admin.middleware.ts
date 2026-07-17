import type { Request, Response, NextFunction } from 'express';

// Owner-only admin guard. See /admin/plan.md §2. Runs AFTER requireAuth.
//
// TODO: allow ONLY when ALL hold:
//   1. req.user is authenticated,
//   2. req.user.role === 'admin' (DB),
//   3. req.user.githubLogin is in env ADMIN_GITHUB_LOGINS (e.g. "Gaurav06120714,aishwaryaV007").
// Then write an AuditLog entry (auditService.writeAudit) for the request and call next().
//
// Fails CLOSED (404 — do not reveal the route exists) until implemented.
export function requireAdmin(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({ error: 'Not found' });
}
