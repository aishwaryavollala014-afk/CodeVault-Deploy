import { prisma } from '../lib/prisma';
import type { NotificationDto, NotificationType, Paginated } from '../types';

function toDto(n: {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationDto {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.readAt !== null,
    createdAt: n.createdAt.toISOString(),
  };
}

/** Cursor-paginated feed (keyset on createdAt+id), newest first. */
export async function listNotifications(
  userId: string,
  opts: { cursor?: string; limit?: number; unreadOnly?: boolean },
): Promise<Paginated<NotificationDto>> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const rows = await prisma.notification.findMany({
    where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  return {
    items: items.map(toDto),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/** Mark notifications read. Omitting ids marks ALL of the user's as read. */
export async function markRead(userId: string, ids?: string[]): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(ids && ids.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  return result.count;
}

/** Internal helper — other services emit notifications through this. */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
): Promise<void> {
  await prisma.notification.create({ data: { userId, type, title, body } });
}
