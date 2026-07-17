import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/overview — owner-only KPIs. Fails closed (404). See /admin/plan.md §3.4.
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Audit the admin request (best-effort).
  prisma.auditLog
    .create({
      data: { userId: admin.userId, action: "admin", targetType: "admin_api", metadata: { path: "/api/overview" } },
    })
    .catch(() => undefined);

  const [users, admins, activeSubscriptions, payments, problemsSynced, syncRuns] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.payment.count(),
    prisma.problem.count(),
    prisma.syncRun.count(),
  ]);
  const agg = await prisma.payment.aggregate({
    _sum: { amount: true, refundedAmt: true },
    where: { status: { in: ["succeeded", "partially_refunded"] } },
  });
  const revenueMinor = (agg._sum.amount ?? 0) - (agg._sum.refundedAmt ?? 0);

  return NextResponse.json({ users, admins, activeSubscriptions, payments, problemsSynced, syncRuns, revenueMinor });
}
