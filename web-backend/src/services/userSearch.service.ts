import prisma from '../lib/prisma';

export class UserSearchService {
  /**
   * Profile search for the global search bar.
   * Ranking (like other social platforms): exact handle match first,
   * then handle/name prefix matches, then contains matches — all
   * case-insensitive, public profiles only.
   *
   * Returns enriched results: follower count, total problems solved,
   * and connected platforms — powering rich search cards on the frontend.
   */
  static async search(q: string, limit = 8) {
    const query = q.trim();
    if (query.length < 2) return { users: [] };

    const users = await prisma.user.findMany({
      where: {
        publicProfileEnabled: true,
        deletedAt: null,
        OR: [
          { handle: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        _count: {
          select: {
            followers: true,
            problems: true,
          },
        },
        connections: {
          where: { deletedAt: null },
          select: { platform: true },
        },
      },
      take: 30, // fetch a pool, rank in-process, return the top slice
    });

    const ql = query.toLowerCase();
    const rank = (u: { handle: string; displayName: string | null }) => {
      const h = u.handle.toLowerCase();
      const d = (u.displayName ?? '').toLowerCase();
      if (h === ql) return 0;            // exact handle
      if (h.startsWith(ql)) return 1;    // handle prefix
      if (d.startsWith(ql)) return 2;    // name prefix
      return 3;                          // contains
    };

    users.sort((a, b) => rank(a) - rank(b) || a.handle.localeCompare(b.handle));

    // Flatten the result for the frontend: pull counts + platform names
    // out of the nested Prisma shape into a cleaner response.
    return {
      users: users.slice(0, limit).map((u) => ({
        id: u.id,
        handle: u.handle,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        followerCount: u._count.followers,
        problemsSolved: u._count.problems,
        platforms: u.connections.map((c) => c.platform),
      })),
    };
  }
}
