import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  HandoverResponseSchema,
  ListPickupParcelsResponseSchema,
  PickupPointSchema,
  PickupStatementSchema,
  PublicPickupSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '20200000-0000-4000-8000-000000000001';
const OTHER = '20200000-0000-4000-8000-000000000002';
const OWNER = '20200000-0000-4000-8000-000000000011';
const RIVAL = '20200000-0000-4000-8000-000000000012';
const SHIPMENT = '20200000-0000-4000-8000-000000000041';
const CODE = 'pickup-public-code-0001';
const SHOP = {
  name: 'Superette test',
  wilayaCode: 47,
  communeId: 4701,
  address: 'Rue test, centre',
  phone: '0555 00 00 01',
  capacity: 1,
  feePerParcel: 100,
};

type Call = { method: 'GET' | 'POST' | 'PATCH'; url: string; payload?: object };

describe.skipIf(!baseUrl || !redisUrl)('partner pickup points (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_pickup_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const auth: Record<string, Record<string, string>> = {};
  const as = (user: string, { method, url, payload }: Call) =>
    app.inject({ method, url, headers: auth[user] ?? {}, ...(payload ? { payload } : {}) });
  const publicPickup = async () =>
    PublicPickupSchema.parse(
      (await app.inject({ method: 'GET', url: `/public/tracking/${CODE}/pickup` })).json(),
    ).pickup;
  const newShop = async () =>
    PickupPointSchema.parse(
      (await as(OWNER, { method: 'POST', url: '/pickup-points', payload: SHOP })).json(),
    );
  const drop = (pointId: string) =>
    as(OWNER, {
      method: 'POST',
      url: `/pickup-points/${pointId}/parcels`,
      payload: { trackingNumber: 'TRK-202' },
    });
  const release = (pointId: string, code: string) =>
    as(OWNER, {
      method: 'POST',
      url: `/pickup-points/${pointId}/parcels/${SHIPMENT}/release`,
      payload: { code, cashCollected: 4500 },
    });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [OWNER]: { [STORE]: 'owner' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    for (const [user, store] of [
      [OWNER, STORE],
      [RIVAL, OTHER],
    ] as const) {
      auth[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': store,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.pickupParcel.deleteMany(),
      prisma.pickupPoint.deleteMany(),
      prisma.shipment.deleteMany(),
    ]);
    await prisma.shipment.create({
      data: {
        id: SHIPMENT,
        storeId: STORE,
        orderId: '20200000-0000-4000-8000-000000000021',
        carrier: 'yalidine',
        reference: 'ORD-202',
        trackingNumber: 'TRK-202',
        publicCode: CODE,
        status: 'in_transit',
        toWilayaCode: 47,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('holds a parcel, shows the code to the customer and releases it against that code', async () => {
    const shop = await newShop();
    expect(shop).toMatchObject({ phone: '+213555000001', holding: 0, active: true });
    expect((await drop(shop.id)).statusCode).toBe(201);
    expect((await drop(shop.id)).statusCode).toBe(409);

    const pickup = await publicPickup();
    expect(pickup).toMatchObject({ name: SHOP.name, state: 'held' });
    const code = pickup?.code ?? '';
    expect(code).toMatch(/^\d{6}$/);

    const wrong = code === '000000' ? '111111' : '000000';
    expect((await release(shop.id, wrong)).statusCode).toBe(403);
    const released = await release(shop.id, code);
    const [parcel] = ListPickupParcelsResponseSchema.parse(released.json()).items;
    expect(parcel).toMatchObject({
      trackingNumber: 'TRK-202',
      state: 'released',
      cashCollected: 4500,
    });
    expect(await publicPickup()).toMatchObject({ state: 'released', code: null });
  });

  it('locks the parcel after five wrong codes', async () => {
    const shop = await newShop();
    await drop(shop.id);
    const code = (await publicPickup())?.code ?? '';
    const wrong = code === '000000' ? '111111' : '000000';
    for (let attempt = 0; attempt < 5; attempt += 1) await release(shop.id, wrong);
    expect((await release(shop.id, code)).statusCode).toBe(429);
  });

  it('hands the cash over once and reports it in the month statement', async () => {
    const shop = await newShop();
    await drop(shop.id);
    await release(shop.id, (await publicPickup())?.code ?? '');
    const points = await as(OWNER, { method: 'GET', url: '/pickup-points' });
    expect(points.json().items[0]).toMatchObject({ holding: 0, cashToCollect: 4500 });

    const handover = { method: 'POST', url: `/pickup-points/${shop.id}/handover` } as const;
    expect(HandoverResponseSchema.parse((await as(OWNER, handover)).json())).toEqual({
      parcels: 1,
      amount: 4500,
    });
    expect((await as(OWNER, handover)).json()).toEqual({ parcels: 0, amount: 0 });

    const month = new Date(Date.now() + 3_600_000).toISOString().slice(0, 7);
    const statement = await as(OWNER, {
      method: 'GET',
      url: `/pickup-points/${shop.id}/statement?month=${month}`,
    });
    expect(PickupStatementSchema.parse(statement.json())).toEqual({
      month,
      released: 1,
      fees: 100,
      cashCollected: 4500,
      cashHandedOver: 4500,
    });
  });

  it('hides a store points and parcels from other stores', async () => {
    const shop = await newShop();
    const url = `/pickup-points/${shop.id}`;
    expect((await as(RIVAL, { method: 'PATCH', url, payload: SHOP })).statusCode).toBe(404);
    expect((await as(RIVAL, { method: 'GET', url: '/pickup-points' })).json()).toEqual({
      items: [],
    });
    const rivalDrop = await as(RIVAL, {
      method: 'POST',
      url: `${url}/parcels`,
      payload: { trackingNumber: 'TRK-202' },
    });
    expect(rivalDrop.statusCode).toBe(404);
  });
});
