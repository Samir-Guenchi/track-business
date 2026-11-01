import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrderSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeShipping, startFakeShipping } from '../../test/fake-shipping.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORES = [
  '52000000-0000-4000-8000-00000000000a',
  '52000000-0000-4000-8000-00000000000b',
  '52000000-0000-4000-8000-00000000000c',
] as const;
const MANAGER = 'c5200000-0000-4000-8000-0000000000aa';

const order = (customer: object) => ({
  customer: { name: 'Client Test', wilayaCode: 16, communeId: 1621, address: 'Rue', ...customer },
  items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 600,
});

describe.skipIf(!baseUrl || !redisUrl)('address and network checks (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: FakeShipping;
  let prisma: PrismaService;
  let token = '';

  const create = async (store: string, customer: object) => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: `Bearer ${token}`, 'x-store-id': store },
      payload: order(customer),
    });
    return OrderSchema.parse(response.json());
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [MANAGER]: Object.fromEntries(STORES.map((store) => [store, 'manager'])),
    });
    token = await identity.tokenFor(MANAGER);
    shipping = await startFakeShipping({ 16: [1601, 1621], 31: [3101] });
    const env = {
      DATABASE_URL: databaseUrl,
      REDIS_URL: redisUrl,
      IDENTITY_URL: identity.url,
      SHIPPING_URL: shipping.url,
      NETWORK_SIGNAL_ENABLED: 'true',
      ROLE_CACHE_SECONDS: '0',
    };
    app = await startTestApp(testEnv(env));
    prisma = app.get(PrismaService);
    await prisma.order.deleteMany({ where: { storeId: { in: [...STORES] } } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    await shipping?.close();
  });

  it('flags a commune that is not in the wilaya', async () => {
    expect((await create(STORES[0], { phone: '0555000101' })).riskFlags).toEqual([]);
    const wrong = await create(STORES[0], { phone: '0555000102', wilayaCode: 31 });

    expect(wrong.riskFlags).toEqual(['impossible_address']);
  });

  it('flags a phone whose parcels came back at two other stores, not one', async () => {
    const phone = '+213555000111';
    const refused = await create(STORES[1], { phone });
    await prisma.order.update({ where: { id: refused.id }, data: { status: 'returned' } });
    expect((await create(STORES[0], { phone })).riskFlags).toEqual([]);

    const again = await create(STORES[2], { phone });
    await prisma.order.update({ where: { id: again.id }, data: { status: 'returned' } });

    expect((await create(STORES[0], { phone })).riskFlags).toContain('network_refusals');
  });
});
