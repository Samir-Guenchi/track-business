import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CarrierRegistry } from '@trackecom/carriers';
import type { FakeCarrier } from '@trackecom/carriers/testing';
import { TRACKING_EVENTS } from '@trackecom/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaOutboxStore } from '../../infrastructure/outbox/prisma-outbox.store.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { CarrierAccountsService } from '../carriers/application/carrier-accounts.service.js';
import { TrackingPoller } from './application/tracking-poller.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '99999999-9999-4999-8999-999999999991';
const OTHER = '99999999-9999-4999-8999-999999999992';
const PAST = new Date('2026-01-01T00:00:00Z');

const scan = (rawStatus: string, status: 'in_transit' | 'delivered', hour: number) => ({
  rawStatus,
  status,
  at: new Date(Date.UTC(2026, 10, 1, hour)),
  location: 'Blida',
  note: null,
  failureReason: null,
});

describe.skipIf(!baseUrl || !redisUrl)(
  'tracking sync: poller, webhooks, outbox (real Postgres)',
  () => {
    const databaseUrl = `${baseUrl}?schema=shipping_tracking_sync_test`;
    let app: NestFastifyApplication;
    let prisma: PrismaService;
    let fake: FakeCarrier;

    const shipment = (id: string, storeId: string, trackingNumber: string) =>
      prisma.shipment.create({
        data: {
          id,
          storeId,
          orderId: 'c0000000-0000-4000-8000-0000000000aa',
          carrier: 'fake',
          reference: `ref-${trackingNumber}`,
          trackingNumber,
          publicCode: `code_${trackingNumber}_0123456789`,
          nextPollAt: PAST,
        },
      });
    const webhook = (storeId: string, signature: string, body: unknown) =>
      app.inject({
        method: 'POST',
        url: `/webhooks/fake/${storeId}`,
        headers: { 'content-type': 'application/json', 'x-fake-signature': signature },
        payload: JSON.stringify(body),
      });

    beforeAll(async () => {
      execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: 'ignore',
      });
      app = await startTestApp(testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl }));
      prisma = app.get(PrismaService);
      fake = app.get(CarrierRegistry).get('fake') as FakeCarrier;
      await prisma.carrierAccount.deleteMany();
      await app.get(CarrierAccountsService).connect(STORE, 'fake', { token: 'valid' });
    });

    beforeEach(async () => {
      await prisma.outboxEvent.deleteMany();
      await prisma.shipment.deleteMany();
      fake.tracking.clear();
    });

    afterAll(async () => {
      await app?.close();
    });

    it('polls due shipments once and schedules the next poll from the new status', async () => {
      await shipment('e0000000-0000-4000-8000-000000000001', STORE, 'FAKE-1');
      fake.tracking.set('FAKE-1', [scan('En route', 'in_transit', 8)]);
      const poller = app.get(TrackingPoller);

      expect(await poller.runOnce()).toBe(1);
      expect(await poller.runOnce()).toBe(0);

      const row = await prisma.shipment.findFirstOrThrow({ where: { trackingNumber: 'FAKE-1' } });
      expect(row.status).toBe('in_transit');
      expect(row.nextPollAt?.getTime()).toBeGreaterThan(Date.now() + 60 * 60_000);
    });

    it('backs off for a store that disconnected its carrier', async () => {
      await shipment('e0000000-0000-4000-8000-000000000002', OTHER, 'FAKE-2');

      await app.get(TrackingPoller).runOnce();

      const row = await prisma.shipment.findFirstOrThrow({ where: { trackingNumber: 'FAKE-2' } });
      expect(row.nextPollAt?.getTime()).toBeGreaterThan(Date.now() + 5 * 60 * 60_000);
    });

    it('applies a signed webhook and rejects a forged one', async () => {
      await shipment('e0000000-0000-4000-8000-000000000003', STORE, 'FAKE-3');
      const body = [{ trackingNumber: 'FAKE-3', events: [scan('Livré', 'delivered', 12)] }];

      const forged = await webhook(STORE, 'guess', body);
      const signed = await webhook(STORE, 'valid', body);
      const replayed = await webhook(STORE, 'valid', body);

      expect(forged.statusCode).toBe(401);
      expect(signed.json()).toEqual({ updated: 1 });
      expect(replayed.statusCode).toBe(200);
      expect(await prisma.trackingEvent.count()).toBe(1);
    });

    it("never lets one store's webhook touch another store's parcel", async () => {
      await shipment('e0000000-0000-4000-8000-000000000004', OTHER, 'FAKE-4');
      const body = [{ trackingNumber: 'FAKE-4', events: [scan('Livré', 'delivered', 12)] }];

      const response = await webhook(STORE, 'valid', body);

      expect(response.json()).toEqual({ updated: 0 });
      expect(await prisma.trackingEvent.count()).toBe(0);
    });

    it('relays outbox rows once', async () => {
      await shipment('e0000000-0000-4000-8000-000000000005', STORE, 'FAKE-5');
      await webhook(STORE, 'valid', [
        { trackingNumber: 'FAKE-5', events: [scan('Livré', 'delivered', 9)] },
      ]);
      const store = app.get(PrismaOutboxStore);
      const seen: string[] = [];
      const publish = async (rows: readonly { id: string; payload: { type: string } }[]) => {
        seen.push(...rows.map((row) => row.payload.type));
        return rows.map((row) => row.id);
      };

      expect(await store.relay(10, publish)).toBe(1);
      expect(await store.relay(10, publish)).toBe(0);
      expect(seen).toEqual([TRACKING_EVENTS.statusChanged]);
    });
  },
);
