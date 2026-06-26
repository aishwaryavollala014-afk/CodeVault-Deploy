import { prisma } from '../lib/prisma';
import { NotFoundError } from '../utils/errors';
import { DEFAULT_SETTINGS, type AppSettings } from '../types';
import type { UpdateSettingsInput } from '../validators/settings.validator';

/** Merge stored partial settings over the defaults so the client always gets a full object. */
function withDefaults(stored: unknown): AppSettings {
  const s = (stored ?? {}) as Partial<AppSettings>;
  return {
    sync: { ...DEFAULT_SETTINGS.sync, ...s.sync },
    publicProfile: { ...DEFAULT_SETTINGS.publicProfile, ...s.publicProfile },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...s.notifications },
    appearance: { ...DEFAULT_SETTINGS.appearance, ...s.appearance },
  };
}

export async function getSettings(userId: string): Promise<AppSettings> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { settings: true, publicProfileEnabled: true },
  });
  if (!user) throw new NotFoundError('User not found');
  const merged = withDefaults(user.settings);
  merged.publicProfile.enabled = user.publicProfileEnabled;
  return merged;
}

export async function updateSettings(
  userId: string,
  patch: UpdateSettingsInput,
): Promise<AppSettings> {
  const current = await getSettings(userId);
  const next: AppSettings = {
    sync: { ...current.sync, ...patch.sync },
    publicProfile: { ...current.publicProfile, ...patch.publicProfile },
    notifications: { ...current.notifications, ...patch.notifications },
    appearance: { ...current.appearance, ...patch.appearance },
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      settings: next as unknown as object,
      // Keep the denormalized column in sync (used by the public profile query).
      publicProfileEnabled: next.publicProfile.enabled,
    },
  });
  return next;
}
