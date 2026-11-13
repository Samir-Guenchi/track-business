import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PublicTrackingResponseSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { addDeliveryDays, algiersDate } from './domain/algeria-calendar.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '55555555-5555-4555-8555-000000000055';
const CARRIER = 'eta-test';
const DAY_MS = 86_400_000;

describe.skipIf(!baseUrl || !redisUrl)('delivery ETA (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_eta_test`;
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const shipment = (data: { status: string; wilaya: number; createdAt: Date; lastEventAt: Date }) =>
    prisma.shipment.create({
      data: {
        id: randomUUID(),
        storeId: STORE,
        orderId: randomUUID(),
        carrier: CARRIER,
        reference: randomUUID(),
        trackingNumber: randomUUID(),
        toWilayaCode: data.wilaya,
        status: data.status,
        publicCode: randomUUID().replaceAll('-', '').slice(0, 24),
        createdAt: data.createdAt,
        lastEventAt: data.lastEventAt,
      },
    });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    app = await startTestApp(testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl }));
    prisma = app.get(PrismaService);
    await prisma.shipment.deleteMany({ where: { carrier: CARRIER } });
    // 30 parcels to Oran (31) delivered in 1 or 2 delivery days, over the last weeks.
    for (let i = 0; i < 30; i += 1) {
      const createdAt = new Date(Date.now() - (10 + i) * DAY_MS);
      const deliveredAt = addDeliveryDays(createdAt, i % 3 === 0 ? 2 : 1);
      await shipment({ status: 'delivered', wilaya: 31, createdAt, lastEventAt: deliveredAt });
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  const track = async (publicCode: string) =>
    PublicTrackingResponseSchema.parse(
      (await app.inject({ method: 'GET', url: `/public/tracking/${publicCode}` })).json(),
    );

  it('shows a 1-2 delivery day range for a parcel on its way to Oran', async () => {
    const now = new Date();
    const moving = await shipment({
      status: 'in_transit',
      wilaya: 31,
      createdAt: now,
      lastEventAt: now,
    });

    const { eta } = await track(moving.publicCode);

    const today = algiersDate(now);
    expect(eta).toEqual({
      earliest: addDeliveryDays(today, 1).toISOString().slice(0, 10),
      latest: addDeliveryDays(today, 2).toISOString().slice(0, 10),
    });
  });

  it('shows nothing without enough history or once delivered', async () => {
    const now = new Date();
    const elsewhere = await shipment({
      status: 'in_transit',
      wilaya: 16,
      createdAt: now,
      lastEventAt: now,
    });
    const done = await shipment({
      status: 'delivered',
      wilaya: 31,
      createdAt: now,
      lastEventAt: now,
    });

    expect((await track(elsewhere.publicCode)).eta).toBeNull();
    expect((await track(done.publicCode)).eta).toBeNull();
  });
});
