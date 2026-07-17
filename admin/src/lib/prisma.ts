import { PrismaClient } from "@prisma/client";

// Owner connection — bypasses RLS so the admin console can read ALL rows. This is intentional
// and only ever reached behind the admin guard (see lib/auth.ts). Never expose these queries
// without getAdmin() passing first.
const globalForPrisma = globalThis as unknown as { adminPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.adminPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.adminPrisma = prisma;
