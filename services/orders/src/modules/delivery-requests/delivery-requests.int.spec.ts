import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DELIVERY_REQUEST_EVENTS, type EventEnvelope } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { RecordDeliveryRequestUseCase } from './application/record-delivery-request.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13913913-1391-4391-8391-139139139139';
const OTHER_STORE = '13913913-1391-4391-8391-139139139140';
const MANAGER = 'a0000000-0000-4000-8000-000000000136';

const newOrder = {
  customer: {
    name: 'Client Demande',
    phone: '0555 00 01 36',
    wilayaCode: 9,
    communeId: 901,
    address: 'Rue D',
  },
  items: [{ name: 'Lampe', quantity: 1, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 400,
};

const created = (storeId: string, orderId: string): EventEnvelope => ({
  id: randomUUID(),
  type: DELIVERY_REQUEST_EVENTS.created,
  occurredAt: '2026-11-05T10:00:00.000Z',
  storeId,
  correlationId: randomUUID(),
  data: {
    requestId: randomUUID(),
    shipmentId: randomUUID(),
    orderId,
    request: { kind: 'reschedule', date: '2026-11-08' },
  },
});

// Shares the orders API schema with the other integration files, which run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('customer delivery requests (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let record: RecordDeliveryRequestUseCase;
  const call = async (request: { method: 'GET' | 'POST'; url: string; payload?: object }) =>
    app.inject({
      ...request,
      headers: { authorization: `Bearer ${await identity.tokenFor(MANAGER)}`, 'x-store-id': STORE },
    });

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [MANAGER]: { [STORE]: 'manager' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    record = app.get(RecordDeliveryRequestUseCase);
    await app.get(PrismaService).order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('adds the request to the order history once', async () => {
    const { id } = (await call({ method: 'POST', url: '/orders', payload: newOrder })).json() as {
      id: string;
    };
    const event = created(STORE, id);

    expect(await record.execute(event)).toBe('recorded');
    expect(await record.execute(event)).toBe('duplicate');
    const history = (await call({ method: 'GET', url: `/orders/${id}/history` })).json() as {
      items: { kind: string; actorId: string | null; note: string | null }[];
    };
    const requested = history.items.filter((item) => item.kind === 'delivery_requested');
    expect(requested).toEqual([
      expect.objectContaining({ actorId: null, note: 'reschedule: 2026-11-08' }),
    ]);
  });

  it('ignores unknown orders and orders of another store', async () => {
    const { id } = (await call({ method: 'POST', url: '/orders', payload: newOrder })).json() as {
      id: string;
    };

    expect(await record.execute(created(STORE, randomUUID()))).toBe('ignored');
    expect(await record.execute(created(OTHER_STORE, id))).toBe('ignored');
  });
});
