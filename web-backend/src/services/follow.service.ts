import prisma from '../lib/prisma';
import { NotificationService } from './notification.service';

const USER_SELECT = { id: true, handle: true, displayName: true, avatarUrl: true } as const;

export class FollowService {
  /** Resolve a public user by handle or throw 'User not found'. */
  private static async resolveUser(handle: string) {
    const user = await prisma.user.findUnique({
      where: { handle },
      select: { id: true, handle: true, publicProfileEnabled: true },
    });
    if (!user || !user.publicProfileEnabled) throw new Error('User not found');
    return user;
  }

  /** Follow a user by handle. Idempotent — refollowing is a no-op. */
  static async follow(followerId: string, followerHandle: string, targetHandle: string) {
    const target = await this.resolveUser(targetHandle);
    if (target.id === followerId) throw new Error('Cannot follow yourself');

    try {
      await prisma.follow.create({ data: { followerId, followingId: target.id } });
    } catch (err: any) {
      if (err?.code === 'P2002') return { following: true }; // already following
      throw err;
    }

    // Notify the followed user (deduped against refollow spam inside the service).
    await NotificationService.notifyNewFollower(target.id, followerHandle);
    return { following: true };
  }

  /** Unfollow a user by handle. Idempotent. */
  static async unfollow(followerId: string, targetHandle: string) {
    const target = await this.resolveUser(targetHandle);
    await prisma.follow.deleteMany({ where: { followerId, followingId: target.id } });
    return { following: false };
  }

  /** Public list of a user's followers (cursor = last follower's userId). */
  static async listFollowers(handle: string, cursor?: string, take = 30) {
    const target = await this.resolveUser(handle);
    const rows = await prisma.follow.findMany({
      where: { followingId: target.id },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { followerId_followingId: { followerId: cursor, followingId: target.id } }, skip: 1 } : {}),
      include: { follower: { select: USER_SELECT } },
    });
    const hasMore = rows.length > take;
    const page = rows.slice(0, take);
    return {
      users: page.map((r) => ({ ...r.follower, followedAt: r.createdAt })),
      nextCursor: hasMore ? page[page.length - 1].followerId : null,
    };
  }

  /** Public list of who a user follows (cursor = last followed userId). */
  static async listFollowing(handle: string, cursor?: string, take = 30) {
    const target = await this.resolveUser(handle);
    const rows = await prisma.follow.findMany({
      where: { followerId: target.id },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { followerId_followingId: { followerId: target.id, followingId: cursor } }, skip: 1 } : {}),
      include: { following: { select: USER_SELECT } },
    });
    const hasMore = rows.length > take;
    const page = rows.slice(0, take);
    return {
      users: page.map((r) => ({ ...r.following, followedAt: r.createdAt })),
      nextCursor: hasMore ? page[page.length - 1].followingId : null,
    };
  }

  /** Follower/following counts + whether `viewerId` follows the user. */
  static async getFollowStats(userId: string, viewerId?: string) {
    const [followerCount, followingCount, viewerEdge] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      viewerId && viewerId !== userId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
          })
        : Promise.resolve(null),
    ]);
    return { followerCount, followingCount, isFollowing: !!viewerEdge };
  }
}
