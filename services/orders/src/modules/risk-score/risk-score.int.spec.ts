import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrderSchema, RiskScoreSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '50500000-0000-4000-8000-000000000001';
const OTHER_STORE = '50500000-0000-4000-8000-000000000002';
const MANAGER = 'c5000000-0000-4000-8000-000000000001';

describe.skipIf(!baseUrl || !redisUrl)('return-risk score (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let token = '';

  const score = (id: string, store = STORE) =>
    app.inject({
      method: 'GET',
      url: `/orders/${id}/risk-score`,
      headers: { authorization: `Bearer ${token}`, 'x-store-id': store },
    });
  /** Orders are moved to midday, so the night-order rule does not depend on the test clock. */
  const create = async (phone: string, item = 'Robe') => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: `Bearer ${token}`, 'x-store-id': STORE },
      payload: {
        customer: { name: 'Client Test', phone, wilayaCode: 16, communeId: 1621, address: 'Rue' },
        items: [{ name: item, quantity: 1, unitPrice: 2500 }],
        deliveryType: 'home',
        shippingFee: 600,
      },
    });
    const order = OrderSchema.parse(response.json());
    const midday = new Date('2026-10-20T11:00:00Z');
    await prisma.order.update({ where: { id: order.id }, data: { createdAt: midday } });
    return order;
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [MANAGER]: { [STORE]: 'manager', [OTHER_STORE]: 'manager' },
    });
    token = await identity.tokenFor(MANAGER);
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.order.deleteMany({ where: { storeId: { in: [STORE, OTHER_STORE] } } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('scores a new customer low', async () => {
    const { id } = await create('0555000501');
    const risk = RiskScoreSchema.parse((await score(id)).json());

    expect(risk).toMatchObject({ orderId: id, score: 0, level: 'low', reasons: [] });
  });

  it('explains a customer who refused a parcel before', async () => {
    const earlier = await create('0555000502');
    await prisma.order.update({ where: { id: earlier.id }, data: { status: 'returned' } });
    const { id } = await create('0555000502', 'Chemise');

    const risk = RiskScoreSchema.parse((await score(id)).json());

    expect(risk.score).toBe(30);
    expect(risk.reasons[0]).toMatchObject({
      code: 'customer_returned_before',
      params: { count: 1 },
    });
    expect(risk.reasons[0]?.text.fr).toBe('Ce numéro a refusé 1 colis chez vous');
  });

  it("answers 404 for another store's order", async () => {
    const { id } = await create('0555000503');
    expect((await score(id, OTHER_STORE)).statusCode).toBe(404);
  });
});
