import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { HealthStatusSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from './test/test-app.js';

describe('identity health (dependencies offline)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('is live without its dependencies', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(HealthStatusSchema.parse(response.json()).service).toBe('identity');
  });

  it('is not ready while the database and Redis are unreachable', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
  });

  it('publishes its OpenAPI document', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/openapi.json' });

    expect(response.json()).toMatchObject({
      openapi: '3.1.0',
      info: { title: 'TrackEcom identity' },
    });
  });
});
