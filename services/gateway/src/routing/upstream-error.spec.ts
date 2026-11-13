import 'reflect-metadata';
import { ApiErrorSchema } from '@trackecom/contracts';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGatewayApp } from '../create-gateway-app.js';
import { testEnv } from '../test/test-env.js';

describe('gateway when a service is down', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // Port 9 (discard) has nothing listening: every call is refused.
    app = await createGatewayApp(testEnv({ ORDERS_URL: 'http://127.0.0.1:9' }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('answers 502 in the shared error shape without leaking the upstream address', async () => {
    const response = await app.inject({ method: 'GET', url: '/orders' });
    expect(response.statusCode).toBe(502);
    expect(ApiErrorSchema.parse(response.json()).error.code).toBe('gateway.upstream_unavailable');
    expect(response.body).not.toContain('127.0.0.1');
  });
});
