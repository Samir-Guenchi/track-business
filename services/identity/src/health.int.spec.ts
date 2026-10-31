import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, testEnv } from './test/test-app.js';

const databaseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];

// Runs in CI (Postgres + Redis service containers) and locally when both URLs are set.
describe.skipIf(!databaseUrl || !redisUrl)('identity health (real Postgres and Redis)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await startTestApp(testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl }));
  });

  afterAll(async () => {
    await app?.close();
  });

  it('is ready when both dependencies answer', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.json()).toMatchObject({
      status: 'ok',
      checks: { database: 'ok', redis: 'ok' },
    });
  });
});
