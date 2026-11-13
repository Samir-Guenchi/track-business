import { loadEnv } from '@trackecom/service-kit';
import { EnvSchema, type Env } from '../config/env.schema.js';

const LOCAL_UPSTREAMS = {
  IDENTITY_URL: 'http://127.0.0.1:4001',
  SHIPPING_URL: 'http://127.0.0.1:4002',
  ORDERS_URL: 'http://127.0.0.1:4003',
  PAYMENTS_URL: 'http://127.0.0.1:4004',
  NOTIFICATIONS_URL: 'http://127.0.0.1:4005',
  INTEGRATIONS_URL: 'http://127.0.0.1:4006',
};

export function testEnv(overrides: Record<string, string> = {}): Env {
  return loadEnv(EnvSchema, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    ...LOCAL_UPSTREAMS,
    ...overrides,
  });
}
