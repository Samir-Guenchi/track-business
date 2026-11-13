import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListMessagesResponseSchema,
  ListTemplatesResponseSchema,
  NotificationSettingsSchema,
  UsageResponseSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '46464646-4646-4646-8646-464646464646';
const USERS = {
  owner: 'c4600000-0000-4000-8000-000000000001',
  agent: 'c4600000-0000-4000-8000-000000000002',
} as const;
type User = keyof typeof USERS;

describe.skipIf(!baseUrl || !redisUrl)('notifications admin API (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=notifications_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  type Method = 'GET' | 'PUT' | 'POST' | 'DELETE';
  const call = (user: User, request: `${Method} ${string}`, payload?: object) => {
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
      [USERS.owner]: { [STORE]: 'owner' },
      [USERS.agent]: { [STORE]: 'agent' },
    });
    for (const [user, id] of Object.entries(USERS) as [User, string][]) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(id)}`,
        'x-store-id': STORE,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.notificationSettings.deleteMany({ where: { storeId: STORE } });
    await prisma.notificationTemplate.deleteMany({ where: { storeId: STORE } });
    await prisma.optOut.deleteMany({ where: { storeId: STORE } });
    await prisma.message.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('starts off and saves the settings the owner chooses', async () => {
    const before = NotificationSettingsSchema.parse(
      (await call('agent', 'GET /notifications/settings')).json(),
    );
    expect(before.enabled).toBe(false);

    const wanted = { ...before, enabled: true, channel: 'whatsapp', storeName: 'Boutique Test' };
    expect((await call('agent', 'PUT /notifications/settings', wanted)).statusCode).toBe(403);
    expect((await call('owner', 'PUT /notifications/settings', wanted)).json()).toEqual(wanted);
    expect((await call('agent', 'GET /notifications/settings')).json()).toEqual(wanted);
  });

  it('lists built-in templates and keeps a store text until it is reset', async () => {
    const url = '/notifications/templates/parcel_shipped/sms/fr';
    const saved = await call('owner', `PUT ${url}`, { body: 'Colis {ref} : {tracking_link}' });
    expect(saved.json()).toMatchObject({ custom: true });
    expect((await call('owner', `PUT ${url}`, { body: 'Hi {phone}' })).statusCode).toBe(400);

    const list = ListTemplatesResponseSchema.parse(
      (await call('agent', 'GET /notifications/templates')).json(),
    );
    expect(list.items).toHaveLength(36);
    const shipped = list.items.find(
      (t) => t.trigger === 'parcel_shipped' && t.channel === 'sms' && t.language === 'fr',
    );
    expect(shipped).toMatchObject({ body: 'Colis {ref} : {tracking_link}', custom: true });

    expect((await call('owner', `DELETE ${url}`)).statusCode).toBe(204);
    expect((await call('owner', `DELETE ${url}`)).statusCode).toBe(404);
  });

  it('records opt-outs in any phone spelling', async () => {
    expect(
      (await call('agent', 'POST /notifications/opt-outs', { phone: '0555 00 00 46' })).statusCode,
    ).toBe(204);
    expect(await prisma.optOut.count({ where: { storeId: STORE, phone: '+213555000046' } })).toBe(
      1,
    );
    expect((await call('owner', 'DELETE /notifications/opt-outs/0555000046')).statusCode).toBe(204);
  });

  it('lists messages without phone or text and sums the month cost', async () => {
    const base = {
      storeId: STORE,
      orderId: randomUUID(),
      trigger: 'parcel_shipped',
      channel: 'sms',
      language: 'ar',
    };
    const queuedAt = new Date('2026-11-10T10:00:00Z');
    const sent = { status: 'delivered', sendAfter: queuedAt, queuedAt, costCentimes: 650 };
    await prisma.message.createMany({
      data: [
        { id: randomUUID(), ...base, ...sent, sourceEventId: 'e1' },
        {
          id: randomUUID(),
          ...base,
          ...sent,
          status: 'failed',
          costCentimes: null,
          sourceEventId: 'e2',
        },
      ],
    });

    const page = ListMessagesResponseSchema.parse(
      (await call('agent', 'GET /notifications/messages')).json(),
    );
    expect(page.items).toHaveLength(2);
    expect(Object.keys(page.items[0] ?? {})).not.toContain('phone');

    expect((await call('agent', 'GET /notifications/usage?month=2026-11')).statusCode).toBe(403);
    const usage = UsageResponseSchema.parse(
      (await call('owner', 'GET /notifications/usage?month=2026-11')).json(),
    );
    expect(usage).toEqual({ month: '2026-11', sent: 1, delivered: 1, failed: 1, costDzd: 6.5 });
  });
});
