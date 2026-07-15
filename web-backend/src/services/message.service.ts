import prisma from '../lib/prisma';
import { NotificationService } from './notification.service';

const USER_SELECT = { id: true, handle: true, displayName: true, avatarUrl: true } as const;
export const MAX_MESSAGE_LENGTH = 2000;

export class MessageService {
  /** Resolve a public user by handle or throw 'User not found'. */
  private static async resolveUser(handle: string) {
    const user = await prisma.user.findUnique({
      where: { handle },
      select: { ...USER_SELECT, publicProfileEnabled: true },
    });
    if (!user || !user.publicProfileEnabled) throw new Error('User not found');
    return user;
  }

  /**
   * Recent conversations for the caller: one row per partner with the latest
   * message and unread count. Built from model queries (NOT $queryRaw) so the
   * RLS GUC is applied — raw queries bypass the Prisma RLS extension.
   */
  static async listConversations(userId: string) {
    const recent = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 400, // plenty for a V1 conversation list
      include: {
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    });

    const byPartner = new Map<string, { partner: typeof recent[number]['sender']; lastMessage: typeof recent[number]; unread: number }>();
    for (const m of recent) {
      const partner = m.senderId === userId ? m.receiver : m.sender;
      let entry = byPartner.get(partner.id);
      if (!entry) {
        entry = { partner, lastMessage: m, unread: 0 };
        byPartner.set(partner.id, entry);
      }
      if (m.receiverId === userId && !m.readAt) entry.unread += 1;
    }

    return {
      conversations: [...byPartner.values()].map(({ partner, lastMessage, unread }) => ({
        user: { id: partner.id, handle: partner.handle, displayName: partner.displayName, avatarUrl: partner.avatarUrl },
        lastMessage: {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          fromMe: lastMessage.senderId === userId,
        },
        unread,
      })),
    };
  }

  /** Total unread messages for the caller (drives the sidebar badge). */
  static async unreadCount(userId: string) {
    const count = await prisma.message.count({ where: { receiverId: userId, readAt: null } });
    return { unread: count };
  }

  /**
   * Chat history with one partner (newest page last, cursor = oldest loaded id).
   * Marks incoming messages read and clears the bell notification for this sender.
   */
  static async getConversation(userId: string, myHandle: string, partnerHandle: string, cursor?: string, take = 50) {
    const partner = await this.resolveUser(partnerHandle);

    const rows = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partner.id },
          { senderId: partner.id, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > take;
    const page = rows.slice(0, take).reverse(); // oldest → newest for rendering

    // Mark unread incoming messages as read + clear the sender's bell entry.
    const unreadIds = page.filter((m) => m.receiverId === userId && !m.readAt).map((m) => m.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { readAt: new Date() },
      });
      await NotificationService.clearMessageNotification(userId, partner.handle);
    }

    return {
      user: { id: partner.id, handle: partner.handle, displayName: partner.displayName, avatarUrl: partner.avatarUrl },
      messages: page.map((m) => ({
        id: m.id,
        content: m.content,
        fromMe: m.senderId === userId,
        readAt: m.readAt,
        createdAt: m.createdAt,
      })),
      nextCursor: hasMore ? rows[take].id : null,
    };
  }

  /** Send a message. Sender ALWAYS comes from the auth token, never the body. */
  static async send(userId: string, myHandle: string, partnerHandle: string, content: string) {
    const trimmed = (content ?? '').trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    if (trimmed.length > MAX_MESSAGE_LENGTH) throw new Error('Message too long');

    const partner = await this.resolveUser(partnerHandle);
    if (partner.id === userId) throw new Error('Cannot message yourself');

    const message = await prisma.message.create({
      data: { senderId: userId, receiverId: partner.id, content: trimmed },
    });

    // One unread bell entry per sender, updated in place (never one per message).
    await NotificationService.upsertMessageNotification(partner.id, myHandle, trimmed);

    return {
      message: {
        id: message.id,
        content: message.content,
        fromMe: true,
        readAt: null,
        createdAt: message.createdAt,
      },
    };
  }
}
