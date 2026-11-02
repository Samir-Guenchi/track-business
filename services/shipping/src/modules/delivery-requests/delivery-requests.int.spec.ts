import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  DELIVERY_REQUEST_EVENTS,
  DeliveryChoicesSchema,
  DeliveryRequestSchema,
  ListDeliveryRequestsResponseSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { seedGeo } from '../geo/infrastructure/seed/seed-geo.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13600000-0000-4000-8000-000000000001';
const OTHER = '13600000-0000-4000-8000-000000000002';
const PACKER = '13600000-0000-4000-8000-000000000011';
const RIVAL = '13600000-0000-4000-8000-000000000012';
const CODE = 'choices-public-code-0001';
const ORDER = '13600000-0000-4000-8000-000000000021';

describe.skipIf(!baseUrl || !redisUrl)('customer delivery choices (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_choices_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const auth: Record<string, Record<string, string>> = {};
  const publicCall = (method: 'GET' | 'POST', path: string, payload?: object) =>
    app.inject({
      method,
      url: `/public/tracking/${CODE}/${path}`,
      ...(payload ? { payload } : {}),
    });
  type SellerCall = { method: 'GET' | 'PATCH'; url: string; payload?: object };
  const seller = (user: string, { method, url, payload }: SellerCall) =>
    app.inject({ method, url, headers: auth[user] ?? {}, ...(payload ? { payload } : {}) });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [PACKER]: { [STORE]: 'packer' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    for (const [user, store] of [
      [PACKER, STORE],
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
    await seedGeo(prisma, [], 'test');
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.outboxEvent.deleteMany(),
      prisma.shipment.deleteMany(),
      prisma.stopDesk.deleteMany(),
      prisma.storePrice.deleteMany(),
    ]);
    const commune = { id: 1601, wilayaCode: 16, nameFr: 'Alger Centre', nameAr: 'الجزائر الوسطى' };
    await prisma.commune.upsert({
      where: { id: 1601 },
      create: { ...commune, datasetVersion: 'test' },
      update: {},
    });
    await prisma.stopDesk.create({
      data: {
        id: '13600000-0000-4000-8000-000000000031',
        carrier: 'yalidine',
        communeId: 1601,
        name: 'Agence Alger Centre',
        address: 'Rue test',
      },
    });
    await prisma.storePrice.createMany({
      data: [
        { storeId: STORE, wilayaCode: 16, deliveryType: 'home', price: 600 },
        { storeId: STORE, wilayaCode: 16, deliveryType: 'stopdesk', price: 400 },
      ],
    });
    await prisma.shipment.create({
      data: {
        id: '13600000-0000-4000-8000-000000000041',
        storeId: STORE,
        orderId: ORDER,
        carrier: 'yalidine',
        reference: 'ORD-136',
        trackingNumber: 'TRK-136',
        publicCode: CODE,
        status: 'in_transit',
        toWilayaCode: 16,
        deliveryType: 'home',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('offers every choice with the stop-desk saving, and takes a switch', async () => {
    const before = DeliveryChoicesSchema.parse((await publicCall('GET', 'choices')).json());
    expect(before).toMatchObject({ stopDeskFeeDelta: -200, remainingToday: 3, requests: [] });
    expect(before.kinds).toContain('switch_stopdesk');

    const taken = await publicCall('POST', 'requests', { kind: 'switch_stopdesk' });
    expect(taken.statusCode).toBe(201);
    const after = DeliveryChoicesSchema.parse(taken.json());
    expect(after.remainingToday).toBe(2);
    expect(after.requests[0]).toMatchObject({
      request: { kind: 'switch_stopdesk' },
      state: 'pending',
    });

    const events = await prisma.outboxEvent.findMany();
    expect(events.map((event) => event.type)).toEqual([DELIVERY_REQUEST_EVENTS.created]);
  });

  it('refuses a past day, a closed parcel and a fourth request', async () => {
    const yesterday = { kind: 'reschedule', date: '2020-01-01' };
    expect((await publicCall('POST', 'requests', yesterday)).statusCode).toBe(400);
    for (const time of ['10:00', '12:00', '14:00']) {
      expect((await publicCall('POST', 'requests', { kind: 'call_after', time })).statusCode).toBe(
        201,
      );
    }
    expect(
      (await publicCall('POST', 'requests', { kind: 'call_after', time: '16:00' })).statusCode,
    ).toBe(429);

    await prisma.shipment.update({
      where: { publicCode: CODE },
      data: { status: 'out_for_delivery' },
    });
    const closed = await publicCall('POST', 'requests', { kind: 'call_after', time: '18:00' });
    expect(closed.statusCode).toBe(409);
  });

  it('lists requests for the seller, who marks them sent; other stores see nothing', async () => {
    await publicCall('POST', 'requests', {
      kind: 'fix_address',
      address: 'Cité 200 logements bloc B',
    });

    const list = await seller(PACKER, {
      method: 'GET',
      url: `/delivery-requests?state=pending&orderId=${ORDER}`,
    });
    const [request] = ListDeliveryRequestsResponseSchema.parse(list.json()).items;
    expect(request).toMatchObject({ trackingNumber: 'TRK-136', request: { kind: 'fix_address' } });

    const rival = await seller(RIVAL, {
      method: 'PATCH',
      url: `/delivery-requests/${request?.id}`,
      payload: {
        state: 'sent',
      },
    });
    expect(rival.statusCode).toBe(404);
    const sent = await seller(PACKER, {
      method: 'PATCH',
      url: `/delivery-requests/${request?.id}`,
      payload: {
        state: 'sent',
      },
    });
    expect(DeliveryRequestSchema.parse(sent.json()).state).toBe('sent');
    const again = await seller(PACKER, {
      method: 'PATCH',
      url: `/delivery-requests/${request?.id}`,
      payload: {
        state: 'dismissed',
      },
    });
    expect(again.statusCode).toBe(404);
  });
});
