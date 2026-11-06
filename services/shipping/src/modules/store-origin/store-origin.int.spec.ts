import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { type EventEnvelope, STORE_EVENTS } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ApplyStoreProfileUseCase } from './application/apply-store-profile.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '16016016-1601-4601-8601-160160160160';
const PACKER = 'a0000000-0000-4000-8000-000000000160';
const NO_ORIGIN = '/carriers/suggestion?wilayaCode=31&deliveryType=home';

const profileUpdated = (
  at: string,
  originWilayaCode: number | null,
  storeId = STORE,
): EventEnvelope => ({
  id: randomUUID(),
  type: STORE_EVENTS.profileUpdated,
  occurredAt: at,
  storeId: STORE,
  correlationId: randomUUID(),
  data: {
    storeId,
    originWilayaCode,
    originCommuneId: null,
    logoUrl: null,
    defaultLanguage: 'fr',
  },
});

describe.skipIf(!baseUrl || !redisUrl)('store origin from the profile (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_store_origin_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let apply: ApplyStoreProfileUseCase;
  let prisma: PrismaService;
  const suggest = async (url: string) =>
    app.inject({
      method: 'GET',
      url,
      headers: { authorization: `Bearer ${await identity.tokenFor(PACKER)}`, 'x-store-id': STORE },
    });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [PACKER]: { [STORE]: 'packer' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    apply = app.get(ApplyStoreProfileUseCase);
    prisma = app.get(PrismaService);
    await prisma.storeOrigin.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('asks for the origin while the profile has none', async () => {
    const response = await suggest(NO_ORIGIN);

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain('suggestion.origin_unknown');
  });

  it('keeps the newest profile, whatever order the events arrive in', async () => {
    expect(await apply.execute(profileUpdated('2026-11-06T10:00:00.000Z', 31))).toBe('applied');
    expect(await apply.execute(profileUpdated('2026-11-06T09:00:00.000Z', 16))).toBe('stale');
    expect(await apply.execute(profileUpdated('2026-11-06T10:00:00.000Z', 31))).toBe('stale');
    expect(await apply.execute(profileUpdated('2026-11-06T11:00:00.000Z', 31, randomUUID()))).toBe(
      'ignored',
    );

    const row = await prisma.storeOrigin.findUniqueOrThrow({ where: { storeId: STORE } });
    expect(row.originWilayaCode).toBe(31);
  });

  it('suggests a carrier from the profile origin when the query leaves it out', async () => {
    const response = await suggest(NO_ORIGIN);

    expect(response.statusCode).toBe(200);
  });

  it('asks again once the seller clears the origin', async () => {
    await apply.execute(profileUpdated('2026-11-06T12:00:00.000Z', null));

    expect((await suggest(NO_ORIGIN)).statusCode).toBe(400);
  });
});
