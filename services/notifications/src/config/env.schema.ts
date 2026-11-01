import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

/** Compose passes an unset variable as ''; treat it as unset so the default or "off" applies. */
const unsetIfEmpty = (value: unknown) => (value === '' ? undefined : value);

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4005),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),
  /** Internal URL of the identity service: access-token keys and the caller's store roles. */
  IDENTITY_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4001'),
  /** How long a user's store roles are cached; a role change applies after at most this. */
  ROLE_CACHE_SECONDS: z.coerce.number().int().min(0).max(600).default(60),
  /** Internal URL of the orders service: customer contacts at send time (ADR-0004). */
  ORDERS_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4003'),
  /** Shared secret for orders' `/internal` routes; without it nothing can be sent. */
  INTERNAL_TOKEN: z.preprocess(unsetIfEmpty, z.string().min(32).optional()),
  /** Base of the public tracking page in the web app; a parcel's public code is appended. */
  TRACKING_URL: z.preprocess(unsetIfEmpty, z.url().default('http://localhost:3000/t')),
  /** Secret in the receipt webhook URL registered with the provider; unset refuses receipts. */
  MESSAGE_WEBHOOK_TOKEN: z.preprocess(unsetIfEmpty, z.string().min(32).optional()),
  /** Runs the background loops (event consumers, sender). Off in API tests. */
  WORKERS_ENABLED: z.stringbool().default(true),
});

export type Env = z.infer<typeof EnvSchema>;

export const ENV = Symbol('ENV');
