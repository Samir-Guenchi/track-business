import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ListAuditResponseSchema, STORE_EVENTS, StoreProfileSchema } from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { IdentityClient } from '../../test/identity-client.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];

describe.skipIf(!baseUrl || !redisUrl)('store profile (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=identity_profile_test`;
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let client: IdentityClient;
  const tokens = { owner: '', agent: '', other: '' };
  let storeId = '';

  const profile = (token: string, body?: Record<string, unknown>) =>
    body
      ? client.call('PATCH', '/stores/current/profile', { token, storeId, body })
      : client.call('GET', '/stores/current/profile', { token, storeId });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    app = await startTestApp(
      testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, RATE_LIMIT_PER_MINUTE: '1000' }),
    );
    prisma = app.get(PrismaService);
    await prisma.user.deleteMany();
    await prisma.store.deleteMany();
    await prisma.outboxEvent.deleteMany();
    client = new IdentityClient(app);
    tokens.owner = await client.signUp('owner.profile@example.dz', 'Karim Owner');
    tokens.agent = await client.signUp('agent.profile@example.dz', 'Yacine Agent');
    tokens.other = await client.signUp('other.profile@example.dz', 'Nadia Other');
    storeId = (
      await client.call('POST', '/stores', { token: tokens.owner, body: { name: 'Boutique P' } })
    ).json().id;
    await client.call('POST', '/stores/current/invitations', {
      token: tokens.owner,
      storeId,
      body: { email: 'agent.profile@example.dz', role: 'agent' },
    });
    const token = client.lastToken('store_invitation', 'agent.profile@example.dz');
    await client.call('POST', '/invitations/accept', { token: tokens.agent, body: { token } });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('starts empty, in French', async () => {
    const empty = StoreProfileSchema.parse((await profile(tokens.owner)).json());
    expect(empty).toMatchObject({ originWilayaCode: null, carriers: [], defaultLanguage: 'fr' });
  });

  it('saves the fields sent, audits them and announces the change', async () => {
    const saved = await profile(tokens.owner, {
      originWilayaCode: 16,
      originCommuneId: 1601,
      contactPhone: '0550 12 34 56',
      carriers: ['yalidine'],
    });
    const moved = await profile(tokens.owner, { originWilayaCode: 31, dailyVolume: '10_50' });

    expect(StoreProfileSchema.parse(saved.json())).toMatchObject({ contactPhone: '+213550123456' });
    expect(StoreProfileSchema.parse(moved.json())).toMatchObject({
      originWilayaCode: 31,
      originCommuneId: null,
      carriers: ['yalidine'],
      dailyVolume: '10_50',
    });
    const events = await prisma.outboxEvent.findMany({ orderBy: { occurredAt: 'asc' } });
    expect(events.map((event) => [event.type, event.storeId])).toEqual([
      [STORE_EVENTS.profileUpdated, storeId],
      [STORE_EVENTS.profileUpdated, storeId],
    ]);
    const audit = await client.call('GET', `/audit?entity=store&id=${storeId}`, {
      token: tokens.owner,
      storeId,
    });
    const entry = ListAuditResponseSchema.parse(audit.json()).items.find(
      (item) => item.action === 'store.profile_updated',
    );
    expect(entry?.changes).toBeDefined();
  });

  it('lets an agent read but not change it, and hides it from other stores', async () => {
    expect((await profile(tokens.agent)).statusCode).toBe(200);
    expect((await profile(tokens.agent, { defaultLanguage: 'ar' })).statusCode).toBe(403);
    expect((await profile(tokens.other)).statusCode).toBe(403);
  });

  it('refuses an empty change and a logo URL sent by the client', async () => {
    expect((await profile(tokens.owner, {})).statusCode).toBe(400);
    expect((await profile(tokens.owner, { logoUrl: 'https://example.com/x.png' })).statusCode).toBe(
      400,
    );
  });
});
