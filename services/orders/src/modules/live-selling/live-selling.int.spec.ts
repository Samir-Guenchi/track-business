import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  AddLiveCommentsResponseSchema,
  ListLiveSessionsResponseSchema,
  LiveSessionSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19900000-0000-4000-8000-000000000001';
const OTHER = '19900000-0000-4000-8000-000000000002';
const SELLER = '19900000-0000-4000-8000-000000000011';
const RIVAL = '19900000-0000-4000-8000-000000000012';

describe.skipIf(!baseUrl || !redisUrl)('live selling (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  type Call = { method: 'GET' | 'POST' | 'PATCH'; url: string; payload?: object };
  const call = async (user: string, { method, url, payload }: Call) => {
    const store = user === SELLER ? STORE : OTHER;
    const authorization = `Bearer ${await identity.tokenFor(user)}`;
    const headers = { authorization, 'x-store-id': store };
    return app.inject({ method, url, headers, ...(payload ? { payload } : {}) });
  };

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [SELLER]: { [STORE]: 'manager' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('turns comments into one reservation per phone and code, then links the order', async () => {
    const products = [
      { code: 'a1', name: 'Robe fleurie', unitPrice: 2900 },
      { code: 'B2', name: 'Abaya', unitPrice: 4500 },
    ];
    const created = await call(SELLER, {
      method: 'POST',
      url: '/live-sessions',
      payload: { title: 'Live du soir', products },
    });
    expect(created.statusCode).toBe(201);
    const session = LiveSessionSchema.parse(created.json());
    const comments = ['Amina: A1 L 0555123456', 'A1 L 0555 12 34 56 !!', 'B2 x2 0661234567'];
    const url = `/live-sessions/${session.id}/comments`;
    const first = await call(SELLER, {
      method: 'POST',
      url,
      payload: { text: comments.join('\n') },
    });
    const read = AddLiveCommentsResponseSchema.parse(first.json());
    expect(read).toMatchObject({ added: 2, duplicates: 1, unread: [] });
    const again = await call(SELLER, { method: 'POST', url, payload: { text: comments[0] } });
    expect(again.json()).toMatchObject({ added: 0, duplicates: 1 });

    const reservation = read.session.reservations[0];
    const link = `/live-sessions/${session.id}/reservations/${reservation?.id}`;
    const linked = await call(SELLER, {
      method: 'PATCH',
      url: link,
      payload: { orderId: 'ORD-1' },
    });
    expect(LiveSessionSchema.parse(linked.json()).reservations[0]?.orderId).toBe('ORD-1');
    const list = ListLiveSessionsResponseSchema.parse(
      (await call(SELLER, { method: 'GET', url: '/live-sessions' })).json(),
    );
    expect(list.items.find((item) => item.id === session.id)).toMatchObject({
      reservations: 2,
      ordered: 1,
    });
  });

  it('hides a session from another store', async () => {
    const products = [{ code: 'A1', name: 'Robe', unitPrice: 2000 }];
    const created = await call(SELLER, {
      method: 'POST',
      url: '/live-sessions',
      payload: { title: 'Live', products },
    });
    const id = LiveSessionSchema.parse(created.json()).id;
    expect((await call(RIVAL, { method: 'GET', url: `/live-sessions/${id}` })).statusCode).toBe(
      404,
    );
    const text = { text: 'A1 0555123456' };
    const post = { method: 'POST' as const, url: `/live-sessions/${id}/comments`, payload: text };
    expect((await call(RIVAL, post)).statusCode).toBe(404);
  });
});
