import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { InvoiceSchema, ListInvoicesResponseSchema, OrderSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { LEGAL_COPIES, type LegalCopyRepository } from './application/ports/legal-copy.port.js';
import { COMPLETE_LEGAL } from './test/legal-fixture.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '14000000-0000-4000-8000-000000000001';
const MANAGER = '14000000-0000-4000-8000-000000000011';
const AGENT = '14000000-0000-4000-8000-000000000012';

const newOrder = {
  customer: {
    name: 'Client Facture',
    phone: '0555 00 01 40',
    wilayaCode: 16,
    communeId: 1601,
    address: 'Rue F',
  },
  items: [{ name: 'Sac', quantity: 2, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 600,
};

interface Options {
  readonly user?: string;
  readonly payload?: object;
}

// Shares the orders API schema: files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('invoices (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let copies: LegalCopyRepository;
  const call = async (method: 'GET' | 'POST', url: string, options: Options = {}) =>
    app.inject({
      method,
      url,
      ...(options.payload ? { payload: options.payload } : {}),
      headers: {
        authorization: `Bearer ${await identity.tokenFor(options.user ?? MANAGER)}`,
        'x-store-id': STORE,
      },
    });
  const order = async (status: 'delivered' | 'shipped') => {
    const response = await call('POST', '/orders', { payload: newOrder });
    const created = OrderSchema.parse(response.json());
    await prisma.order.update({ where: { id: created.id }, data: { status } });
    return created.id;
  };

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [MANAGER]: { [STORE]: 'manager' },
      [AGENT]: { [STORE]: 'agent' },
    });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    copies = app.get(LEGAL_COPIES);
    await prisma.invoice.deleteMany({ where: { storeId: STORE, creditForId: { not: null } } });
    await prisma.invoice.deleteMany({ where: { storeId: STORE } });
    await prisma.invoiceCounter.deleteMany({ where: { storeId: STORE } });
    await prisma.storeLegalCopy.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('refuses until the legal profile is complete, and only for delivered orders', async () => {
    const delivered = await order('delivered');
    const incomplete = await call('POST', `/orders/${delivered}/invoice`);
    expect(incomplete.statusCode).toBe(409);
    expect(incomplete.json()).toMatchObject({
      error: { code: 'invoices.legal_profile_incomplete' },
    });

    await copies.save(STORE, COMPLETE_LEGAL, new Date());
    const shipped = await order('shipped');
    const early = await call('POST', `/orders/${shipped}/invoice`);
    expect(early.json()).toMatchObject({ error: { code: 'invoices.order_not_delivered' } });
  });

  it('numbers invoices without gaps and issues each one once', async () => {
    const [first, second] = [await order('delivered'), await order('delivered')];
    const a = InvoiceSchema.parse((await call('POST', `/orders/${first}/invoice`)).json());
    const again = InvoiceSchema.parse((await call('POST', `/orders/${first}/invoice`)).json());
    const b = InvoiceSchema.parse((await call('POST', `/orders/${second}/invoice`)).json());

    expect(again.id).toBe(a.id);
    expect([a.number, b.number]).toEqual([
      `F-${a.number.slice(2, 6)}-000001`,
      `F-${a.number.slice(2, 6)}-000002`,
    ]);
    expect(a.totals).toMatchObject({ total: 5600, vatRate: 19, totalBeforeTax: 4706 });
    expect(a.seller).toMatchObject({ legalName: 'SARL Test Facture', nif: '000000000000000' });
  });

  it('cancels an invoice with one credit note, readable by money roles only', async () => {
    const listed = ListInvoicesResponseSchema.parse((await call('GET', '/invoices')).json());
    const invoice = listed.items.find((item) => item.kind === 'invoice');
    const url = `/invoices/${invoice?.id}/credit-note`;
    const credit = InvoiceSchema.parse((await call('POST', url)).json());
    const twice = InvoiceSchema.parse((await call('POST', url)).json());

    expect(credit).toMatchObject({ kind: 'credit_note', creditFor: { id: invoice?.id } });
    expect(credit.number).toMatch(/^AV-\d{4}-000001$/);
    expect(twice.id).toBe(credit.id);
    expect((await call('GET', '/invoices', { user: AGENT })).statusCode).toBe(403);
  });
});
