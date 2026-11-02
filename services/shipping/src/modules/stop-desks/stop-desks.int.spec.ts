import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CarrierRegistry } from '@trackecom/carriers';
import type { FakeCarrier } from '@trackecom/carriers/testing';
import { ListStopDesksResponseSchema, SyncStopDesksResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { CarrierAccountsService } from '../carriers/application/carrier-accounts.service.js';
import { parseCommunesCsv } from '../geo/infrastructure/seed/parse-communes-csv.js';
import { seedGeo } from '../geo/infrastructure/seed/seed-geo.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13700000-0000-4000-8000-000000000001';
const OWNER = '13700000-0000-4000-8000-000000000011';
const COMMUNES = `id,wilaya_code,name_fr,name_ar,postal_code,aliases
1601,16,Bab Ezzouar,باب الزوار,16111,
1602,16,Bab El Oued,باب الوادي,,
3101,31,Es Senia,السانية,,`;
const desk = (n: number, communeId: number, gps: [number, number] | null) => ({
  id: `13700000-0000-4000-8000-00000000010${n}`,
  carrier: 'yalidine',
  communeId,
  name: `Agence ${n}`,
  address: `Rue ${n}`,
  latitude: gps?.[0] ?? null,
  longitude: gps?.[1] ?? null,
  hours: { 'sat-thu': '08:00-17:00' },
});

describe.skipIf(!baseUrl || !redisUrl)('stop-desk locator (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_stop_desks_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const list = async (query: string) => {
    const response = await app.inject({ method: 'GET', url: `/geo/stop-desks?${query}` });
    return { status: response.statusCode, body: response.json() as unknown };
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [OWNER]: { [STORE]: 'owner' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await seedGeo(prisma, parseCommunesCsv(COMMUNES), 'test');
    await prisma.stopDesk.deleteMany();
    await prisma.stopDesk.createMany({
      data: [
        desk(1, 1601, [36.7167, 3.1833]),
        desk(2, 1602, [36.7906, 3.0511]),
        desk(3, 1602, null),
        desk(4, 3101, [35.6481, -0.6232]),
      ],
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('lists the desks of a wilaya and of a commune', async () => {
    const wilaya = ListStopDesksResponseSchema.parse((await list('wilayaCode=16')).body);
    expect(wilaya.items.map((each) => each.name)).toEqual(['Agence 1', 'Agence 2', 'Agence 3']);
    expect(wilaya.items[0]).toMatchObject({
      communeNameFr: 'Bab Ezzouar',
      hours: { 'sat-thu': '08:00-17:00' },
    });

    const commune = ListStopDesksResponseSchema.parse((await list('communeId=1602')).body);
    expect(commune.items).toHaveLength(2);
  });

  it('sorts by distance from a point and refuses an empty query', async () => {
    const near = ListStopDesksResponseSchema.parse((await list('lat=36.79&lng=3.05&limit=5')).body);
    expect(near.items.map((each) => each.name)).toEqual(['Agence 2', 'Agence 1']);
    expect(near.items[0]?.distanceKm).toBeLessThan(1);
    expect((await list('carrier=yalidine')).status).toBe(400);
  });

  it("saves a carrier's list, matching commune spellings, and reports the rest", async () => {
    await prisma.carrierAccount.deleteMany();
    await app.get(CarrierAccountsService).connect(STORE, 'fake', { token: 'valid' });
    const fake = app.get(CarrierRegistry).get('fake') as FakeCarrier;
    fake.stopDesks = [
      {
        code: 'C1',
        name: 'Fake Bab Ezzouar',
        wilayaCode: 16,
        communeName: 'BAB EZZOUAR',
        address: 'Cité',
      },
      { code: 'C2', name: 'Fake Nowhere', wilayaCode: 16, communeName: 'Zzzzqqq', address: 'Rue' },
    ];
    const headers = {
      authorization: `Bearer ${await identity.tokenFor(OWNER)}`,
      'x-store-id': STORE,
    };
    const sync = async () =>
      SyncStopDesksResponseSchema.parse(
        (await app.inject({ method: 'POST', url: '/stop-desks/sync/fake', headers })).json(),
      );

    expect(await sync()).toEqual({
      carrier: 'fake',
      saved: 1,
      unmatched: [{ code: 'C2', communeName: 'Zzzzqqq' }],
    });
    expect((await sync()).saved).toBe(1);
    expect(await prisma.stopDesk.count({ where: { carrier: 'fake' } })).toBe(1);
  });
});
