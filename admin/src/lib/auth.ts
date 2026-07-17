import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const SECRET = process.env.JWT_SECRET || "";
const ALLOW = (process.env.ADMIN_GITHUB_LOGINS || "Gaurav06120714,aishwaryaV007")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Owner-only guard for API route handlers. Reads the shared cv_access session cookie
// (host-scoped, so it's visible here on localhost:3100), verifies the JWT with the SAME
// secret as web-backend, then requires DB role === 'admin' AND github login in the allowlist.
// Returns the admin's userId, or null (caller returns 404 — fail closed, never reveal the route).
export async function getAdmin(): Promise<{ userId: string } | null> {
  try {
    const store = await cookies();
    const token = store.get("cv_access")?.value;
    if (!token) return null;
    const { userId } = jwt.verify(token, SECRET) as { userId: string };
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, githubLogin: true },
    });
    const ok = u?.role === "admin" && !!u.githubLogin && ALLOW.includes(u.githubLogin.toLowerCase());
    return ok ? { userId } : null;
  } catch {
    return null;
  }
}
