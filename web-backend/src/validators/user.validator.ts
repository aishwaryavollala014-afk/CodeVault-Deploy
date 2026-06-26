import { z } from 'zod';

/**
 * Update-profile payload. `.strict()` rejects any other field — a user can
 * never set role/plan/email/id via the API (mass-assignment defense, API3).
 */
export const updateUserSchema = z
  .object({
    displayName: z.string().min(1).max(80).optional(),
    handle: z
      .string()
      .regex(/^[a-z0-9_-]{3,30}$/, 'handle must be 3-30 chars of a-z, 0-9, _ or -')
      .optional(),
  })
  .strict();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
