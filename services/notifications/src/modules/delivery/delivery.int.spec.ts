import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  NotificationSettingsSchema,
  ORDER_EVENTS,
  SHIPMENT_EVENTS,
  TRACKING_EVENTS,
} from '@trackecom/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeOrders, startFakeOrders } from '../../test/fake-orders.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { EnqueueMessages } from './application/enqueue-messages.js';
import { MessageSender } from './application/message-sender.js';
import { DELIVERY_PORTS } from './application/ports/delivery.ports.js';
import type { FakeMessageProvider } from './infrastructure/fake-message.provider.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '46460000-0000-4000-8000-000000000001';
const ORDER = '46460000-0000-4000-8000-0000000000a1';
const UNKNOWN_ORDER = '46460000-0000-4000-8000-0000000000a2';
const SECRET = 'internal-test-secret-0123456789abcdef';
const WEBHOOK = 'webhook-test-secret-0123456789abcdefg';

const envelope = (type: string, data: Record<string, unknown>): EventEnvelope => ({
  id: randomUUID(),
  type,
  occurredAt: new Date().toISOString(),
  storeId: STORE,
  correlationId: randomUUID(),
  data,
});

describe.skipIf(!baseUrl || !redisUrl)('sending customer messages (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=notifications_delivery_test`;
  let app: NestFastifyApplication;
  let orders: FakeOrders;
  let prisma: PrismaService;
  let enqueue: EnqueueMessages;
  let sender: MessageSender;
  let provider: FakeMessageProvider;

  const saveSettings = (settings: object) =>
    prisma.notificationSettings.upsert({
      where: { storeId: STORE },
      create: {
        storeId: STORE,
        settings: NotificationSettingsSchema.parse(settings),
        updatedAt: new Date(),
      },
      update: { settings: NotificationSettingsSchema.parse(settings) },
    });
  const statuses = async () =>
    (await prisma.message.findMany({ where: { storeId: STORE } })).map((m) => m.status);

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    orders = await startFakeOrders({
      [ORDER]: { orderId: ORDER, ref: 'TE-1042', name: 'Amine', phone: '+213555000470' },
    });
    const env = {
      DATABASE_URL: databaseUrl,
      REDIS_URL: redisUrl,
      ORDERS_URL: orders.url,
      INTERNAL_TOKEN: SECRET,
      MESSAGE_WEBHOOK_TOKEN: WEBHOOK,
      TRACKING_URL: 'https://track.example/t',
    };
    app = await startTestApp(testEnv(env));
    prisma = app.get(PrismaService);
    enqueue = app.get(EnqueueMessages);
    sender = app.get(MessageSender);
    provider = app.get(DELIVERY_PORTS.provider);
  });

  beforeEach(async () => {
    await prisma.message.deleteMany({ where: { storeId: STORE } });
    await prisma.optOut.deleteMany({ where: { storeId: STORE } });
    // Quiet hours that never apply, so the test does not depend on the clock.
    await saveSettings({
      enabled: true,
      language: 'fr',
      quietHours: { start: 0, end: 0 },
      storeName: 'Boutique',
    });
  });

  afterAll(async () => {
    await app?.close();
    await orders?.close();
  });

  it('sends "shipped" with the tracking link once, even when the event comes twice', async () => {
    const created = envelope(SHIPMENT_EVENTS.created, {
      shipmentId: randomUUID(),
      orderId: ORDER,
      reference: 'ref-1',
      carrier: 'yalidine',
      trackingNumber: 'yal-1',
      publicCode: 'pUbLiCcOdE_0123456789',
      labelUrl: null,
      codAmount: 3100,
    });
    await enqueue.shipmentCreated(created);
    await enqueue.shipmentCreated(created);

    expect(await sender.runOnce()).toBe(1);
    const last = provider.sent.at(-1);
    expect(last).toMatchObject({ channel: 'sms', to: '+213555000470' });
    expect(last?.body).toBe(
      'Boutique : votre colis TE-1042 est expédié avec yalidine. Suivi : https://track.example/t/pUbLiCcOdE_0123456789',
    );
    expect(orders.tokens.at(-1)).toBe(SECRET);
    expect(await statuses()).toEqual(['sent']);
  });

  it('records the delivery receipt', async () => {
    await saveSettings({
      enabled: true,
      triggers: ['order_confirmed'],
      quietHours: { start: 0, end: 0 },
    });
    await enqueue.orderStatusChanged(
      envelope(ORDER_EVENTS.statusChanged, {
        orderId: ORDER,
        from: 'to_confirm',
        to: 'confirmed',
        actorId: null,
        reason: null,
      }),
    );
    await sender.runOnce();
    const providerId = provider.sent.at(-1)?.providerId ?? '';

    const webhook = (token: string) =>
      app.inject({
        method: 'POST',
        url: `/webhooks/messages/fake?token=${token}`,
        payload: { providerId, status: 'delivered' },
      });
    expect((await webhook('wrong-token')).statusCode).toBe(401);
    expect((await webhook(WEBHOOK)).statusCode).toBe(204);
    expect(await statuses()).toEqual(['delivered']);
  });

  it('skips opted-out customers and unknown orders, and ignores triggers the store turned off', async () => {
    await prisma.optOut.create({
      data: { storeId: STORE, phone: '+213555000470', createdAt: new Date() },
    });
    const moved = (orderId: string, to: string) =>
      envelope(TRACKING_EVENTS.statusChanged, {
        shipmentId: randomUUID(),
        orderId,
        carrier: 'yalidine',
        trackingNumber: 'yal-2',
        from: 'in_transit',
        to,
        failureReason: null,
        at: new Date().toISOString(),
      });
    await enqueue.parcelStatusChanged(moved(ORDER, 'out_for_delivery'));
    await enqueue.parcelStatusChanged(moved(UNKNOWN_ORDER, 'failed_attempt'));
    await enqueue.parcelStatusChanged(moved(ORDER, 'delivered'));

    expect(await sender.runOnce()).toBe(2);
    const rows = await prisma.message.findMany({
      where: { storeId: STORE },
      orderBy: { trigger: 'asc' },
    });
    expect(rows.map((row) => [row.trigger, row.status, row.skipReason])).toEqual([
      ['failed_attempt', 'skipped', 'no_contact'],
      ['out_for_delivery', 'skipped', 'opted_out'],
    ]);
  });
});
