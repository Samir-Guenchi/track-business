import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { HealthStatusSchema } from '@trackecom/contracts';
import { createServiceApp, loadEnv } from '@trackecom/service-kit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { EnvSchema } from './config/env.schema.js';

describe('gateway health', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const env = loadEnv(EnvSchema, { NODE_ENV: 'test', LOG_LEVEL: 'silent' });
    app = await createServiceApp({ module: AppModule.forRoot(env), env });
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
