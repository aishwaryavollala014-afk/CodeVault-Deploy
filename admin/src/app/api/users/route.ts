import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users?query= — owner-only user list/search. Fails closed (404). See /admin/plan.md §3.1.
export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const query = req.nextUrl.searchParams.get("query") ?? "";
  const where = query
    ? {
        OR: [
          { githubLogin: { contains: query, mode: "insensitive" as const } },
          { handle: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { displayName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const items = await prisma.user.findMany({
    where,
    take: 25,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      githubLogin: true,
      handle: true,
      displayName: true,
      email: true,
      role: true,
      plan: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items });
}
