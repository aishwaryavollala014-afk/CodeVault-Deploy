import prisma from '../lib/prisma';
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
}
