import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { StuckParcelsResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19700000-0000-4000-8000-0000000000a1';
const OTHER = '19700000-0000-4000-8000-0000000000a2';
const OWNER = '19700000-0000-4000-8000-0000000000b1';
const DAY_MS = 86_400_000;

describe.skipIf(!baseUrl || !redisUrl)('stuck parcels (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_stuck_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [OWNER]: { [STORE]: 'owner' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    const prisma = app.get(PrismaService);
    await prisma.shipment.deleteMany();
    const old = new Date(Date.now() - 20 * DAY_MS);
    const parcels = [
      { n: 1, storeId: STORE, status: 'in_transit', lastEventAt: old },
      { n: 2, storeId: STORE, status: 'in_transit', lastEventAt: new Date() },
      { n: 3, storeId: STORE, status: 'delivered', lastEventAt: old },
      { n: 4, storeId: OTHER, status: 'in_transit', lastEventAt: old },
    ];
    await prisma.shipment.createMany({
      data: parcels.map(({ n, ...parcel }) => ({
        ...parcel,
        id: `19700000-0000-4000-8000-00000000004${n}`,
        orderId: `19700000-0000-4000-8000-00000000002${n}`,
        carrier: 'yalidine',
        reference: `ORD-197-${n}`,
        trackingNumber: `TRK-197-${n}`,
        publicCode: `stuck-public-code-00000${n}`,
        toWilayaCode: 31,
      })),
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it("lists only this store's open parcels idle past their allowance", async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/stuck-parcels',
      headers: { authorization: `Bearer ${await identity.tokenFor(OWNER)}`, 'x-store-id': STORE },
    });

    const body = StuckParcelsResponseSchema.parse(response.json());
    expect(body.items.map((item) => item.trackingNumber)).toEqual(['TRK-197-1']);
    expect(body.items[0]?.idleDays).toBeGreaterThan(3);
    expect(body.hotspots).toEqual([]);
  });
});
