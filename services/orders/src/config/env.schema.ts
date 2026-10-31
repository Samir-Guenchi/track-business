import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4003),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** Internal URL of the identity service: access-token keys and the caller's store roles. */
  IDENTITY_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4001'),
  /** How long a user's store roles are cached; a role change applies after at most this. */
  ROLE_CACHE_SECONDS: z.coerce.number().int().min(0).max(600).default(60),
  /** Runs the background loops (outbox relay, event consumers). Off in API tests. */
  WORKERS_ENABLED: z.stringbool().default(true),
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
