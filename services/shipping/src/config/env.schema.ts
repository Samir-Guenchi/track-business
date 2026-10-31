import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4002),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** Internal URL of the identity service: access-token keys and the caller's store roles. */
  IDENTITY_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4001'),
  /** How long a user's store roles are cached; a role change applies after at most this. */
  ROLE_CACHE_SECONDS: z.coerce.number().int().min(0).max(600).default(60),
  /**
   * Key-encryption key for carrier credentials (base64, 32 bytes), from the secret manager.
   * Each account is encrypted with its own data key, which this key wraps (envelope encryption).
   */
  CARRIER_KEK: z
    .string()
    .refine(
      (value) => Buffer.from(value, 'base64').length === 32,
      'CARRIER_KEK must be 32 bytes, base64',
    ),
  /** Stored next to each account so the key can be rotated without re-encrypting at once. */
  CARRIER_KEK_ID: z
    .string()
    .regex(/^[a-z0-9-]{1,20}$/)
    .default('v1'),
  /** Retired keys still needed to open older rows during a rotation: "v1:base64,v2:base64". */
  CARRIER_KEK_PREVIOUS: z
    .string()
    .regex(/^[a-z0-9-]{1,20}:[A-Za-z0-9+/=]{44}(,[a-z0-9-]{1,20}:[A-Za-z0-9+/=]{44})*$/)
    .optional(),
  /** Runs the background loops (outbox relay, tracking poller). Off in API tests. */
  WORKERS_ENABLED: z.stringbool().default(true),
  /** Registers an in-memory carrier for local development and tests. Refused in production. */
  ENABLE_FAKE_CARRIER: z.stringbool().default(false),
}).refine((env) => !(env.NODE_ENV === 'production' && env.ENABLE_FAKE_CARRIER), {
  message: 'ENABLE_FAKE_CARRIER must be off in production',
  path: ['ENABLE_FAKE_CARRIER'],
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
