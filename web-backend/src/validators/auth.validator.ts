import { z } from 'zod';

/** Optional post-login redirect target (must be a relative app path). */
export const githubStartSchema = z.object({
  next: z
    .string()
    .regex(/^\/[\w\-/]*$/, 'next must be a relative path')
    .optional(),
});

/** GitHub OAuth callback query. */
export const githubCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export type GithubStartInput = z.infer<typeof githubStartSchema>;
export type GithubCallbackInput = z.infer<typeof githubCallbackSchema>;
