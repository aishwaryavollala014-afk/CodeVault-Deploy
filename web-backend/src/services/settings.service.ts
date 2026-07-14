import prisma from '../lib/prisma';
import logger from '../lib/logger';

export interface UserSettingsPayload {
  displayName?: string;
  handle?: string;
  publicProfileEnabled?: boolean;
  settings?: any; // The JSON blob
}

export class SettingsService {
  static async getSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        githubLogin: true,
        publicProfileEnabled: true,
        settings: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateSettings(userId: string, data: UserSettingsPayload) {
    // Basic validation for handle if it's being updated
    if (data.handle !== undefined) {
      const handleRegex = /^[a-zA-Z0-9-]+$/;
      if (!handleRegex.test(data.handle)) {
        throw new Error('Handle can only contain alphanumeric characters and dashes');
      }

      // Check for uniqueness
      const existing = await prisma.user.findUnique({ where: { handle: data.handle } });
      if (existing && existing.id !== userId) {
        throw new Error('Handle is already taken');
      }
    }

    // Since settings is a JSON blob, we want to deep merge it, 
    // but Prisma doesn't support deep JSON merge easily in an update.
    // So we fetch the current settings first if we need to update it.
    let mergedSettings = undefined;
    if (data.settings !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
      });
      const currentSettings = (currentUser?.settings as any) || {};
      
      // Simple shallow merge for top-level keys in the settings JSON 
      // (like sync, notifications, appearance)
      mergedSettings = {
        ...currentSettings,
        ...data.settings
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.handle !== undefined && { handle: data.handle }),
        ...(data.publicProfileEnabled !== undefined && { publicProfileEnabled: data.publicProfileEnabled }),
        ...(mergedSettings !== undefined && { settings: mergedSettings }),
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        githubLogin: true,
        publicProfileEnabled: true,
        settings: true,
      },
    });

    return updatedUser;
  }
}
