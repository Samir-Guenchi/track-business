import { execFileSync } from 'node:child_process';
import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FeeAuditSchema, PayoutSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19600000-0000-4000-8000-0000000000a1';
const OWNER = '19600000-0000-4000-8000-0000000000b1';
const TOKEN = 'internal-token-for-tests-only-0123456789';

const RATES = {
  items: [
    {
      trackingNumber: 'f-1',
      toWilayaCode: 31,
      deliveryType: 'home',
      deliveryFee: 700,
      returnFee: 250,
    },
    {
      trackingNumber: 'f-2',
      toWilayaCode: 31,
      deliveryType: 'home',
      deliveryFee: 700,
      returnFee: 250,
    },
  ],
};

async function startFakeShipping(): Promise<{ url: string; server: Server }> {
  const server = createServer((request, response) => {
    const allowed = request.headers['x-internal-token'] === TOKEN;
    if (!allowed || !request.url?.endsWith('/carrier-fees'))
      return void response.writeHead(401).end();
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(RATES));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, server };
}

describe.skipIf(!baseUrl || !redisUrl)('payout fee audit (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=payments_fee_audit_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: Server;
  let headers: Record<string, string> = {};

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [OWNER]: { [STORE]: 'owner' } });
    headers = { authorization: `Bearer ${await identity.tokenFor(OWNER)}`, 'x-store-id': STORE };
    const fake = await startFakeShipping();
    shipping = fake.server;
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(
      testEnv({ ...env, SHIPPING_URL: fake.url, INTERNAL_TOKEN: TOKEN, ROLE_CACHE_SECONDS: '0' }),
    );
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    shipping?.close();
  });

  it('lists the overcharged lines of a statement with their total', async () => {
    const imported = await app.inject({
      method: 'POST',
      url: '/payouts',
      headers,
      payload: {
        carrier: 'yalidine',
        reference: `AUDIT-${Date.now()}`,
        paidAt: '2026-11-10',
        totalAmount: 2550,
        lines: [
          { trackingNumber: 'f-1', codAmount: 2000, shippingFee: 900, returnFee: 0 },
          { trackingNumber: 'f-2', codAmount: 2000, shippingFee: 700, returnFee: 250 },
        ],
      },
    });
    const { id } = PayoutSchema.parse(imported.json());

    const response = await app.inject({ method: 'GET', url: `/payouts/${id}/fee-audit`, headers });

    const audit = FeeAuditSchema.parse(response.json());
    expect(audit).toMatchObject({
      lines: 2,
      checked: 2,
      overchargedTotal: 450,
      rateCardChecked: true,
    });
    expect(audit.issues.map((issue) => [issue.trackingNumber, issue.issue])).toEqual([
      ['f-1', 'delivery_fee_above_rate'],
      ['f-2', 'return_fee_on_delivered'],
    ]);
  });

  it('answers 404 for a payout of another store', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/payouts/19600000-0000-4000-8000-0000000000ff/fee-audit',
      headers,
    });
    expect(response.statusCode).toBe(404);
  });
});
