import { z } from 'zod';
import { PLATFORMS, type PlatformName } from '../types';

/**
 * Strict username rule (anti-SSRF): only handle-safe characters, no ':' '/'
 * or whitespace, so a username can never smuggle a URL/host into a platform
 * request. Platform hosts are hard-coded in each adapter regardless.
 */
const usernameRegex = /^[A-Za-z0-9_.-]{1,39}$/;

export const createConnectionSchema = z
  .object({
    platform: z.enum(PLATFORMS as unknown as [PlatformName, ...PlatformName[]]),
    username: z.string().regex(usernameRegex, 'invalid username'),
  })
  .strict();

export const authorizeSyncSchema = z
  .object({
    sessionToken: z.string().min(1).max(8192),
  })
  .strict();

export const connectionParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type AuthorizeSyncInput = z.infer<typeof authorizeSyncSchema>;
