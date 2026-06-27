import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { encrypt } from '../lib/crypto';
import { ConflictError, NotFoundError } from '../utils/errors';
import { invalidateUserStats } from './stats.service';
import type { CreateConnectionInput } from '../validators/platform.validator';
import type { PlatformName } from '../types';

/** Connection as exposed to the client — the sync token is NEVER included. */
export interface ConnectionDto {
  id: string;
  platform: PlatformName;
  username: string;
  syncEnabled: boolean;
  tokenStatus: 'none' | 'active' | 'expired';
  lastSyncedAt: string | null;
  solvedCount: number;
}

function toDto(c: {
  id: string;
  platform: PlatformName;
  username: string;
  syncEnabled: boolean;
  tokenStatus: 'none' | 'active' | 'expired';
  lastSyncedAt: Date | null;
  solvedCount: number;
}): ConnectionDto {
  return {
    id: c.id,
    platform: c.platform,
    username: c.username,
    syncEnabled: c.syncEnabled,
    tokenStatus: c.tokenStatus,
    lastSyncedAt: c.lastSyncedAt ? c.lastSyncedAt.toISOString() : null,
    solvedCount: c.solvedCount,
  };
}

export async function listConnections(userId: string): Promise<ConnectionDto[]> {
  const rows = await prisma.connection.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toDto);
}

export async function createConnection(
  userId: string,
  input: CreateConnectionInput,
): Promise<ConnectionDto> {
  try {
    const row = await prisma.connection.create({
      data: { userId, platform: input.platform, username: input.username },
    });
    await invalidateUserStats(userId);
    return toDto(row);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('That platform is already connected');
    }
    throw err;
  }
}

/** Store the encrypted sync token and flip the connection to sync-enabled. */
export async function authorizeSync(
  userId: string,
  connectionId: string,
  sessionToken: string,
): Promise<ConnectionDto> {
  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, userId, deletedAt: null },
  });
  if (!connection) throw new NotFoundError('Connection not found');

  const { cipher, iv } = encrypt(sessionToken);

  const [, updated] = await prisma.$transaction([
    prisma.connectionSecret.upsert({
      where: { connectionId },
      create: { connectionId, tokenCipher: cipher, tokenIv: iv },
      update: { tokenCipher: cipher, tokenIv: iv, rotatedAt: new Date() },
    }),
    prisma.connection.update({
      where: { id: connectionId },
      data: { syncEnabled: true, tokenStatus: 'active' },
    }),
  ]);
  return toDto(updated);
}

export async function removeConnection(userId: string, connectionId: string): Promise<void> {
  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, userId, deletedAt: null },
  });
  if (!connection) throw new NotFoundError('Connection not found');
  // Hard delete cascades the secret (connection_secrets) — token is purged.
  await prisma.connection.delete({ where: { id: connectionId } });
  await invalidateUserStats(userId);
}
