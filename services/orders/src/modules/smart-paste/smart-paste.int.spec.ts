import { execFileSync } from 'node:child_process';
import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { type LocatePlacesResponse, ParseOrderTextResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19300000-0000-4000-8000-000000000001';
const AGENT = '19300000-0000-4000-8000-000000000011';
const VIEWER = '19300000-0000-4000-8000-000000000012';

const PLACES: LocatePlacesResponse = {
  wilaya: { code: 16, matchedText: 'Alger', score: 1 },
  commune: {
    commune: {
      id: 1621,
      wilayaCode: 16,
      nameFr: 'Bab Ezzouar',
      nameAr: 'باب الزوار',
      postalCode: null,
      hasStopDesk: true,
    },
    matchedText: 'bab zouar',
    score: 1,
  },
};

async function startFakeLocator(): Promise<{ url: string; server: Server }> {
  const server = createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/geo/locate') {
      return void response.writeHead(404).end();
    }
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(PLACES));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, server };
}

describe.skipIf(!baseUrl || !redisUrl)('smart paste (real app)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: Server;
  const parse = async (userId: string, text: string) =>
    app.inject({
      method: 'POST',
      url: '/orders/parse-text',
      payload: { text },
      headers: { authorization: `Bearer ${await identity.tokenFor(userId)}`, 'x-store-id': STORE },
    });

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [AGENT]: { [STORE]: 'manager' },
      [VIEWER]: { [STORE]: 'packer' },
    });
    const locator = await startFakeLocator();
    shipping = locator.server;
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(
      testEnv({ ...env, SHIPPING_URL: locator.url, ROLE_CACHE_SECONDS: '0' }),
    );
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    shipping?.close();
  });

  it('fills the form fields from a pasted message', async () => {
    const response = await parse(AGENT, 'Karim 0555 12 34 56 bab zouar Alger robe noire');

    expect(response.statusCode).toBe(200);
    expect(ParseOrderTextResponseSchema.parse(response.json())).toMatchObject({
      name: 'Karim',
      phone: '+213555123456',
      wilayaCode: 16,
      communeId: 1621,
      rest: 'robe noire',
    });
  });

  it('is refused to members who cannot create orders', async () => {
    expect((await parse(VIEWER, 'Karim 0555123456')).statusCode).toBe(403);
  });
});
