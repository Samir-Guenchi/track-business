import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { HealthStatusSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadEnv } from '../config/env.schema.js';
import { createApp } from '../create-app.js';

describe('GET /health', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp(loadEnv({ NODE_ENV: 'test' }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['/health/live', '/health/ready'])('%s matches the health contract', async (url) => {
    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(200);
    expect(HealthStatusSchema.parse(response.json()).service).toBe('gateway');
  });

  it('sends security headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
