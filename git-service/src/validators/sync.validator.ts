import { z } from 'zod';

const platform = z.enum(['leetcode', 'codeforces', 'codechef', 'hackerrank']);

export const triggerSyncSchema = z
  .object({ connectionId: z.string().optional() })
  .strict();

export const platformParamsSchema = z.object({ platform });

export const problemParamsSchema = z.object({
  platform,
  number: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
});

export const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type TriggerSyncInput = z.infer<typeof triggerSyncSchema>;
