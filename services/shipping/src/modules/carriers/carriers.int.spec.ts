import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CarrierAccountSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { CarrierAccountsService } from './application/carrier-accounts.service.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '55555555-5555-4555-8555-555555555555';
const OTHER = '66666666-6666-4666-8666-666666666666';
const USERS = {
  owner: 'b0000000-0000-4000-8000-000000000001',
  agent: 'b0000000-0000-4000-8000-000000000002',
  rival: 'b0000000-0000-4000-8000-000000000003',
} as const;
type User = keyof typeof USERS;

describe.skipIf(!baseUrl || !redisUrl)('carrier accounts API (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_carriers_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  type Method = 'GET' | 'PUT' | 'DELETE';
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
      [USERS.rival]: { [OTHER]: 'owner' },
    });
    const stores: Record<User, string> = { owner: STORE, agent: STORE, rival: OTHER };
    for (const [user, id] of Object.entries(USERS) as [User, string][]) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(id)}`,
        'x-store-id': stores[user],
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    await app.get(PrismaService).carrierAccount.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('lists the carriers a store can connect', async () => {
    const { items } = (await call('agent', 'GET /carriers')).json();

    expect(items).toContainEqual(
      expect.objectContaining({
        code: 'fake',
        credentialFields: [expect.objectContaining({ key: 'token' })],
      }),
    );
  });

  it('checks credentials with the carrier before saving them', async () => {
    const refused = await call('owner', 'PUT /carriers/accounts/fake', {
      credentials: { token: 'wrong' },
    });
    const unknown = await call('owner', 'PUT /carriers/accounts/nope', {
      credentials: { token: 'valid' },
    });

    expect(refused.json()).toMatchObject({ error: { code: 'carriers.invalid_credentials' } });
    expect(unknown.statusCode).toBe(404);
  });

  it('stores credentials encrypted and never returns them', async () => {
    const saved = await call('owner', 'PUT /carriers/accounts/fake', {
      credentials: { token: 'valid' },
    });
    const row = await app
      .get(PrismaService)
      .carrierAccount.findFirstOrThrow({ where: { storeId: STORE } });

    expect(CarrierAccountSchema.parse(saved.json()).carrier).toBe('fake');
    expect(JSON.stringify((await call('agent', 'GET /carriers/accounts')).json())).not.toContain(
      'valid',
    );
    expect(Buffer.from(row.secret).toString('latin1')).not.toContain('valid');
    const { ctx } = await app.get(CarrierAccountsService).connection(STORE, 'fake');
    expect(ctx.credentials).toEqual({ token: 'valid' });
  });

  it('keeps accounts per store and lets only owners and managers change them', async () => {
    expect((await call('rival', 'GET /carriers/accounts')).json().items).toEqual([]);
    expect((await call('agent', 'DELETE /carriers/accounts/fake')).statusCode).toBe(403);
    expect((await call('rival', 'DELETE /carriers/accounts/fake')).statusCode).toBe(409);
    expect((await call('owner', 'DELETE /carriers/accounts/fake')).statusCode).toBe(204);
  });
});
