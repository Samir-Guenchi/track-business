import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListReturnRequestsResponseSchema,
  PublicReturnStatusSchema,
  RETURN_REQUEST_EVENTS,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '20100000-0000-4000-8000-000000000001';
const OTHER = '20100000-0000-4000-8000-000000000002';
const OWNER = '20100000-0000-4000-8000-000000000011';
const RIVAL = '20100000-0000-4000-8000-000000000012';
const SHIPMENT = '20100000-0000-4000-8000-000000000041';
const NEW_ORDER = '20100000-0000-4000-8000-000000000022';
const CODE = 'returns-public-code-0001';
const DAY_MS = 86_400_000;

describe.skipIf(!baseUrl || !redisUrl)('customer return requests (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_return_requests_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const auth: Record<string, Record<string, string>> = {};
  const publicCall = (method: 'GET' | 'POST', payload?: object) =>
    app.inject({
      method,
      url: `/public/tracking/${CODE}/return-request`,
      ...(payload ? { payload } : {}),
    });
  type SellerCall = { method: 'GET' | 'PATCH'; url: string; payload?: object };
  const seller = (user: string, { method, url, payload }: SellerCall) =>
    app.inject({ method, url, headers: auth[user] ?? {}, ...(payload ? { payload } : {}) });
  const shipment = (id: string, orderId: string, publicCode: string) =>
    prisma.shipment.create({
      data: {
        id,
        storeId: STORE,
        orderId,
        carrier: 'yalidine',
        reference: `REF-${publicCode}`,
        trackingNumber: `TRK-${publicCode}`,
        publicCode,
        status: 'delivered',
        toWilayaCode: 16,
      },
    });
  const deliveredAt = (at: Date) =>
    prisma.trackingEvent.create({
      data: {
        id: '20100000-0000-4000-8000-000000000051',
        shipmentId: SHIPMENT,
        storeId: STORE,
        status: 'delivered',
        carrierStatus: 'Livré',
        at,
        dedupeKey: 'delivered-1',
      },
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
      prisma.outboxEvent.deleteMany(),
      prisma.returnRequest.deleteMany(),
      prisma.shipment.deleteMany(),
    ]);
    await shipment(SHIPMENT, '20100000-0000-4000-8000-000000000021', CODE);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('takes one exchange request after delivery and shows the new parcel', async () => {
    await deliveredAt(new Date(Date.now() - DAY_MS));
    expect(PublicReturnStatusSchema.parse((await publicCall('GET')).json()).canRequest).toBe(true);

    const body = { kind: 'exchange', reason: 'wrong_size', wanted: 'taille L' };
    const created = await publicCall('POST', body);
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ canRequest: false, request: { state: 'pending' } });
    expect((await publicCall('POST', body)).statusCode).toBe(409);

    const list = await seller(OWNER, { method: 'GET', url: '/return-requests?state=pending' });
    const [request] = ListReturnRequestsResponseSchema.parse(list.json()).items;
    expect(request).toMatchObject({ trackingNumber: `TRK-${CODE}`, wanted: 'taille L' });

    const decision = { decision: 'accept_exchange', newOrderId: NEW_ORDER };
    const url = `/return-requests/${request?.id}`;
    expect((await seller(RIVAL, { method: 'PATCH', url, payload: decision })).statusCode).toBe(404);
    expect((await seller(OWNER, { method: 'PATCH', url, payload: decision })).json().state).toBe(
      'accepted_exchange',
    );
    expect((await seller(OWNER, { method: 'PATCH', url, payload: decision })).statusCode).toBe(409);

    await shipment('20100000-0000-4000-8000-000000000042', NEW_ORDER, 'exchange-code-00000001');
    const status = PublicReturnStatusSchema.parse((await publicCall('GET')).json());
    expect(status.request?.newTrackingCode).toBe('exchange-code-00000001');
    const events = await prisma.outboxEvent.findMany({ orderBy: { occurredAt: 'asc' } });
    expect(events.map((event) => event.type)).toEqual([
      RETURN_REQUEST_EVENTS.created,
      RETURN_REQUEST_EVENTS.decided,
    ]);
  });

  it('refuses a request before delivery and after the window', async () => {
    const body = { kind: 'return', reason: 'changed_mind' };
    expect((await publicCall('POST', body)).statusCode).toBe(409);
    await deliveredAt(new Date(Date.now() - 8 * DAY_MS));
    expect((await publicCall('GET')).json()).toMatchObject({ canRequest: false, request: null });
    expect((await publicCall('POST', body)).statusCode).toBe(409);
  });
});
