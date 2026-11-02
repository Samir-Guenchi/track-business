import { BaseEnvSchema } from '@trackecom/service-kit';
import { z } from 'zod';

const serviceUrl = z.url({ protocol: /^https?$/ });

export const EnvSchema = BaseEnvSchema.extend({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  IDENTITY_URL: serviceUrl,
  SHIPPING_URL: serviceUrl,
  ORDERS_URL: serviceUrl,
  PAYMENTS_URL: serviceUrl,
  NOTIFICATIONS_URL: serviceUrl,
  INTEGRATIONS_URL: serviceUrl,
});

export type Env = z.infer<typeof EnvSchema>;
