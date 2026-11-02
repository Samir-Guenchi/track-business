import type { Env } from '../config/env.schema.js';
import type { UpstreamService } from './route-table.js';

export type Upstreams = Readonly<Record<UpstreamService, string>>;

export function upstreamsFrom(env: Env): Upstreams {
  return {
    identity: env.IDENTITY_URL,
    shipping: env.SHIPPING_URL,
    orders: env.ORDERS_URL,
    payments: env.PAYMENTS_URL,
    notifications: env.NOTIFICATIONS_URL,
    integrations: env.INTEGRATIONS_URL,
  };
}
