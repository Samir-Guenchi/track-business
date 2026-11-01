import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4003),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** Internal URL of the identity service: access-token keys and the caller's store roles. */
  IDENTITY_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4001'),
  /** Internal URL of the shipping service: the commune list of each wilaya (geo reference data). */
  SHIPPING_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4002'),
  /**
   * Counts refused parcels for a phone across other stores (#52). Off until the privacy question
   * is decided; when on, only a count is used and nothing about the other stores is shown.
   */
  NETWORK_SIGNAL_ENABLED: z.stringbool().default(false),
  /**
   * Shared secret other services present on `/internal` routes (ADR-0004). Unset turns those
   * routes off. From the secret manager, 32 characters or more.
   */
  INTERNAL_TOKEN: z.string().min(32).optional(),
  /** Base of the customer's self-confirmation page (#54); the token is appended. */
  SELF_CONFIRM_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:3000/confirm'),
  /** How long a user's store roles are cached; a role change applies after at most this. */
  ROLE_CACHE_SECONDS: z.coerce.number().int().min(0).max(600).default(60),
  /** Runs the background loops (outbox relay, event consumers). Off in API tests. */
  WORKERS_ENABLED: z.stringbool().default(true),
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
