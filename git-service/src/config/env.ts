import { z } from 'zod';

/**
 * git-service environment contract. JWT_SECRET and ENCRYPTION_KEY MUST match
 * web-backend: the same JWT is verified here, and the same key decrypts the
 * platform/GitHub tokens. Validated once at boot (fail-fast).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(16),
  ENCRYPTION_KEY: z.string().min(1),

  SYNC_CRON: z.string().default('0 */6 * * *'),
  SYNC_CONCURRENCY: z.coerce.number().int().positive().default(3),
  // Max concurrent sync jobs PER platform (best-effort Redis semaphore).
  SYNC_PLATFORM_CONCURRENCY: z.coerce.number().int().positive().default(2),
  // Kill switch — set SYNC_ENABLED=false to pause all sync (scheduler + trigger).
  // (z.coerce.boolean treats any non-empty string as true, so parse explicitly.)
  SYNC_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() !== 'false'),

  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid git-service environment:\n${issues}\n`);
  process.exit(1);
}

export const env: Env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
