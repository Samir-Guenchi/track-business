import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

const unsetIfEmpty = (value: unknown) => (value === '' ? undefined : value);
/** Parses the key file's JSON; bad JSON is left as text so the schema reports it. */
const jsonIfSet = (value: unknown) => {
  if (value === '' || typeof value !== 'string') return unsetIfEmpty(value);
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};
const ServiceAccountSchema = z.object({
  client_email: z.email(),
  private_key: z.string().includes('PRIVATE KEY'),
});
const KEK_PATTERN = /^[a-z0-9-]{1,20}:[A-Za-z0-9+/=]{44}(,[a-z0-9-]{1,20}:[A-Za-z0-9+/=]{44})*$/;

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4006),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** Internal URL of the identity service: access-token keys and the caller's store roles. */
  IDENTITY_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4001'),
  /** How long a user's store roles are cached; a role change applies after at most this. */
  ROLE_CACHE_SECONDS: z.coerce.number().int().min(0).max(600).default(60),
  /** Key-encryption key for shop tokens (base64, 32 bytes), from the secret manager. */
  SHOP_KEK: z
    .string()
    .refine(
      (value) => Buffer.from(value, 'base64').length === 32,
      'SHOP_KEK must be 32 bytes, base64',
    ),
  /** Stored next to each connection so the key can be rotated without re-encrypting at once. */
  SHOP_KEK_ID: z
    .string()
    .regex(/^[a-z0-9-]{1,20}$/)
    .default('v1'),
  /** Retired keys still needed to open older rows during a rotation: "v1:base64,v2:base64". */
  SHOP_KEK_PREVIOUS: z.string().regex(KEK_PATTERN).optional(),
  /** Internal URL of shipping: wilaya and commune reference data for address matching. */
  SHIPPING_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4002'),
  /** How often each shop is polled for new or changed orders (webhooks arrive in between). */
  SYNC_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(1440).default(5),
  /** How far back the first sync of a new shop imports orders. */
  BACKFILL_DAYS: z.coerce.number().int().min(0).max(90).default(30),
  /** Internal URL of orders: where a shipped order came from, to push tracking back. */
  ORDERS_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4003'),
  /** Shared secret for orders' /internal routes; tracking is not pushed back without it. */
  INTERNAL_TOKEN: z.preprocess(unsetIfEmpty, z.string().min(32).optional()),
  /** The web app's public tracking page; shops get `<TRACKING_URL>/<public code>`. */
  TRACKING_URL: z.preprocess(unsetIfEmpty, z.url().default('http://localhost:3000/t')),
  /**
   * TrackEcom's Google service account key file (JSON), from the secret manager. Sellers share
   * their order sheet with its email (#26). Google Sheets is offered only when it is set.
   */
  GOOGLE_SERVICE_ACCOUNT_JSON: z.preprocess(jsonIfSet, ServiceAccountSchema.optional()),
  /** Runs the background loops (outbox relay, shop polling). Off in API tests. */
  WORKERS_ENABLED: z.stringbool().default(true),
  /** Registers an in-memory shop for local development and tests. Refused in production. */
  ENABLE_FAKE_CONNECTOR: z.stringbool().default(false),
}).refine((env) => !(env.NODE_ENV === 'production' && env.ENABLE_FAKE_CONNECTOR), {
  message: 'ENABLE_FAKE_CONNECTOR must be off in production',
  path: ['ENABLE_FAKE_CONNECTOR'],
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
