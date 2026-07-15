import prisma, { adminPrisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  static list(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  static async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // Emit a notification for a user (called on real events: connect, sync, expiry…).
  static create(userId: string, type: NotificationType, title: string, body?: string) {
    return prisma.notification.create({ data: { userId, type, title, body } });
  }

  // ————— Cross-user social notifications —————
  // These insert a notification for ANOTHER user, which RLS on `notifications`
  // (owner_isolation) would block under the requester's context — so they go
  // through adminPrisma, the same system-level client used by auth.

  /** "X started following you" — skipped if the same actor already notified in the last 24h (refollow spam guard). */
  static async notifyNewFollower(targetUserId: string, followerHandle: string) {
    const title = `${followerHandle} started following you`;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await adminPrisma.notification.findFirst({
      where: { userId: targetUserId, type: 'follow', title, createdAt: { gte: dayAgo } },
      select: { id: true },
    });
    if (recent) return;
    await adminPrisma.notification.create({
      data: { userId: targetUserId, type: 'follow', title, body: 'Visit their profile to follow back.' },
    });
  }

  /** "X sent you a message" — one UNREAD notification per sender, updated in place (never one per message). */
  static async upsertMessageNotification(receiverId: string, senderHandle: string, preview: string) {
    const title = `${senderHandle} sent you a message`;
    const snippet = preview.length > 50 ? `${preview.slice(0, 50)}…` : preview;
    const existing = await adminPrisma.notification.findFirst({
      where: { userId: receiverId, type: 'message', title, readAt: null },
      select: { id: true },
    });
    if (existing) {
      await adminPrisma.notification.update({
        where: { id: existing.id },
        data: { body: snippet, createdAt: new Date() },
      });
    } else {
      await adminPrisma.notification.create({
        data: { userId: receiverId, type: 'message', title, body: snippet },
      });
    }
  }

  /** Clear the unread message notification from a sender once the receiver opens the conversation. */
  static async clearMessageNotification(receiverId: string, senderHandle: string) {
    await adminPrisma.notification.updateMany({
      where: { userId: receiverId, type: 'message', title: `${senderHandle} sent you a message`, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
