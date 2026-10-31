import { z } from 'zod';

/** Variables every service reads. Services extend this with their own (DATABASE_URL, ...). */
export const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(300),
  /** Error tracking; unset locally and in CI. */
  SENTRY_DSN: z.url().optional(),
  /** `staging` or `production`; tags errors and logs. */
  DEPLOY_ENV: z.string().min(1).default('local'),
  /** Image tag / git SHA set by the deploy workflow. */
  RELEASE: z.string().min(1).optional(),
});

export type BaseEnv = z.infer<typeof BaseEnvSchema>;
