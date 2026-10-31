import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrderSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type FakeIdentity, startFakeIdentity } from '../../test/fake-identity.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '11111111-1111-4111-8111-111111111111';
const OTHER_STORE = '22222222-2222-4222-8222-222222222222';

const newOrder = (overrides: object = {}) => ({
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 02',
    wilayaCode: 16,
    communeId: 1621,
    address: 'Rue des tests',
  },
  items: [{ name: 'Robe', quantity: 2, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 600,
  ...overrides,
});

describe.skipIf(!baseUrl || !redisUrl)('orders API (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  const headers: Record<string, Record<string, string>> = {};

  type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
  const call = (user: string, request: `${Method} ${string}`, payload?: object) => {
    const [method, url] = request.split(' ') as [Method, string];
    return app.inject({
      method,
      url,
      headers: headers[user] ?? {},
      ...(payload ? { payload } : {}),
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      manager: { [STORE]: 'manager' },
      agent: { [STORE]: 'agent' },
      packer: { [STORE]: 'packer' },
      outsider: { [OTHER_STORE]: 'owner' },
    });
    for (const user of ['manager', 'agent', 'packer', 'outsider']) {
      const store = user === 'outsider' ? OTHER_STORE : STORE;
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': store,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    const prisma = app.get(PrismaService);
    await prisma.$transaction([
      prisma.order.deleteMany(),
      prisma.auditEvent.deleteMany(),
      prisma.outboxEvent.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('creates an order with a normalised phone, a ref and the amount to collect', async () => {
    const response = await call('manager', 'POST /orders', newOrder());

    expect(response.statusCode).toBe(201);
    const order = OrderSchema.parse(response.json());
    expect(order).toMatchObject({ status: 'new', subtotal: 5000, codAmount: 5600 });
    expect(order.customer.phone).toBe('+213555000002');
    expect(order.ref).toMatch(/^TE-/);
  });

  it('flags the same phone and items within 48 h as a possible duplicate', async () => {
    const first = (await call('manager', 'POST /orders', newOrder())).json();
    const second = (await call('manager', 'POST /orders', newOrder())).json();

    expect(second.possibleDuplicateOfId).toBe(first.id);
  });

  it('refuses the same external order twice', async () => {
    const imported = newOrder({ source: 'shopify', externalRef: 'shop-1001' });
    await call('manager', 'POST /orders', imported);

    const again = await call('manager', 'POST /orders', imported);

    expect(again.json()).toMatchObject({ error: { code: 'orders.already_imported' } });
  });

  it('walks the status machine and rejects illegal moves', async () => {
    const { id } = (await call('manager', 'POST /orders', newOrder())).json();

    const confirm = await call('agent', `POST /orders/${id}/status`, { status: 'confirmed' });
    const skip = await call('agent', `POST /orders/${id}/status`, { status: 'delivered' });
    const ship = await call('agent', `POST /orders/${id}/status`, { status: 'ready_to_ship' });
    const pack = await call('packer', `POST /orders/${id}/status`, { status: 'ready_to_ship' });

    expect(confirm.json().status).toBe('confirmed');
    expect(skip.json()).toMatchObject({ error: { code: 'auth.forbidden' } });
    expect(ship.statusCode).toBe(403);
    expect(pack.json().status).toBe('ready_to_ship');
    const back = await call('manager', `POST /orders/${id}/status`, { status: 'new' });
    expect(back.json()).toMatchObject({ error: { code: 'orders.illegal_transition' } });
  });

  it('records the history with who did what', async () => {
    const { id } = (await call('manager', 'POST /orders', newOrder())).json();
    await call('agent', `POST /orders/${id}/status`, {
      status: 'cancelled',
      reason: 'Client a annulé',
    });

    const { items } = (await call('manager', `GET /orders/${id}/history`)).json();

    expect(items[0]).toMatchObject({
      kind: 'status_changed',
      fromStatus: 'new',
      toStatus: 'cancelled',
      note: 'Client a annulé',
    });
    expect(items[1]).toMatchObject({ kind: 'created' });
  });

  it('lets an agent read but not create orders', async () => {
    expect((await call('agent', 'GET /orders')).statusCode).toBe(200);
    expect((await call('agent', 'POST /orders', newOrder())).statusCode).toBe(403);
  });

  it('hides another store and its orders completely', async () => {
    const { id } = (await call('manager', 'POST /orders', newOrder())).json();

    expect((await call('outsider', `GET /orders/${id}`)).statusCode).toBe(404);
    const spoofed = { ...headers['outsider'], 'x-store-id': STORE };
    const response = await app.inject({ method: 'GET', url: '/orders', headers: spoofed });
    expect(response.statusCode).toBe(403);
  });

  it('filters by status and finds an order by any phone spelling', async () => {
    await call(
      'manager',
      'POST /orders',
      newOrder({ customer: { ...newOrder().customer, phone: '0661 12 34 56' } }),
    );

    const byPhone = (await call('manager', 'GET /orders?q=%2B213%20661%2012%2034%2056')).json();
    const cancelled = (await call('manager', 'GET /orders?status=cancelled')).json();

    expect(byPhone.items).toHaveLength(1);
    expect(cancelled.items.every((order: { status: string }) => order.status === 'cancelled')).toBe(
      true,
    );
  });

  it('applies a bulk action order by order and reports failures', async () => {
    const { id } = (await call('manager', 'POST /orders', newOrder())).json();
    const missing = '33333333-3333-4333-8333-333333333333';

    const response = await call('manager', 'POST /orders/bulk', {
      action: 'add_tag',
      orderIds: [id, missing],
      tag: 'VIP',
    });

    expect(response.json()).toEqual({
      succeeded: [id],
      failed: [{ orderId: missing, code: 'orders.not_found' }],
    });
    expect((await call('manager', `GET /orders/${id}`)).json().tags).toEqual(['vip']);
  });

  it('edits before shipping, then deletes', async () => {
    const { id } = (await call('manager', 'POST /orders', newOrder())).json();
    const edited = await call('manager', `PUT /orders/${id}`, newOrder({ discount: 600 }));

    expect(edited.json().codAmount).toBe(5000);
    expect((await call('manager', `DELETE /orders/${id}`)).statusCode).toBe(204);
    expect((await call('manager', `GET /orders/${id}`)).statusCode).toBe(404);
  });
});
