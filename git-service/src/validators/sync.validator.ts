import { z } from 'zod';

// POST /api/sync — trigger a sync. Omit connectionId to sync all of the caller's connections.
export const triggerSyncSchema = z
  .object({
    connectionId: z.string().cuid().optional(),
  })
  .strict();

export type TriggerSyncInput = z.infer<typeof triggerSyncSchema>;
