import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { BenchmarkResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '20000000-0000-4000-8000-000000000001';
const OWNER = '20000000-0000-4000-8000-000000000011';
const DAY_MS = 86_400_000;

interface Parcels {
  readonly storeId: string;
  readonly wilaya: number;
  readonly delivered: number;
  readonly returned: number;
}

describe.skipIf(!baseUrl || !redisUrl)('market benchmarks (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_benchmarks_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const seed = ({ storeId, wilaya, delivered, returned }: Parcels) => {
    const createdAt = new Date(Date.now() - 5 * DAY_MS);
    const lastEventAt = new Date(createdAt.getTime() + 2 * DAY_MS);
    const row = (status: string) => {
      const id = randomUUID();
      return {
        id,
        storeId,
        orderId: randomUUID(),
        carrier: 'yalidine',
        reference: id,
        trackingNumber: id,
        publicCode: id.replaceAll('-', '').slice(0, 24),
        status,
        toWilayaCode: wilaya,
        createdAt,
        lastEventAt,
      };
    };
    const data = [
      ...Array.from({ length: delivered }, () => row('delivered')),
      ...Array.from({ length: returned }, () => row('returned')),
    ];
    return prisma.shipment.createMany({ data });
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
    await prisma.shipment.deleteMany();
    await seed({ storeId: STORE, wilaya: 11, delivered: 5, returned: 5 });
    await seed({ storeId: STORE, wilaya: 16, delivered: 4, returned: 1 });
    for (let index = 0; index < 5; index += 1) {
      const storeId = randomUUID();
      await seed({ storeId, wilaya: 11, delivered: 8, returned: 2 });
      if (index < 4) await seed({ storeId, wilaya: 16, delivered: 20, returned: 0 });
    }
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('shows the market only where five other stores contribute', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/benchmarks?days=30',
      headers: { authorization: `Bearer ${await identity.tokenFor(OWNER)}`, 'x-store-id': STORE },
    });

    const body = BenchmarkResponseSchema.parse(response.json());
    const tamanrasset = body.wilayas.find((line) => line.wilayaCode === 11);
    expect(tamanrasset).toMatchObject({
      own: { parcels: 10, deliveryRate: 0.5, avgDeliveryDays: 2 },
      market: { parcels: 50, deliveryRate: 0.8 },
    });
    expect(body.wilayas.find((line) => line.wilayaCode === 16)?.market).toBeNull();
    expect(body.carriers.find((line) => line.wilayaCode === 11)?.carrier).toBe('yalidine');
  });
});
