import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrderFormSchema, SubmitFormOrderResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeShipping, startFakeShipping } from '../../test/fake-shipping.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13613613-1361-4361-8361-136136136136';
const OWNER = 'a0000000-0000-4000-8000-000000000137';
const PRICES = {
  items: [
    { wilayaCode: 16, deliveryType: 'home' as const, price: 400 },
    { wilayaCode: 33, deliveryType: 'home' as const, price: null },
  ],
  freeShippingFrom: null,
};
const FORM = {
  name: 'Landing sac',
  title: 'Boutique Test',
  products: [{ id: 'sac', name: 'Sac', unitPrice: 3500, variants: ['S', 'M'] }],
  deliveryTypes: ['home'],
};
const order = (phone: string, extra: object = {}) => ({
  name: 'Client Form',
  phone,
  wilayaCode: 16,
  communeId: 1601,
  address: 'Rue A',
  deliveryType: 'home',
  productId: 'sac',
  variant: 'M',
  quantity: 2,
  ...extra,
});

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('public form orders (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: FakeShipping;
  let prisma: PrismaService;
  let key = '';
  const submit = (payload: object, remoteAddress = '203.0.113.1') =>
    app.inject({ method: 'POST', url: `/public/forms/${key}/orders`, payload, remoteAddress });

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [OWNER]: { [STORE]: 'owner' } });
    shipping = await startFakeShipping({ 16: [1601] }, PRICES);
    app = await startTestApp(
      testEnv({
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        IDENTITY_URL: identity.url,
        SHIPPING_URL: shipping.url,
        INTERNAL_TOKEN: 'internal-token-for-tests-0123456789',
        ROLE_CACHE_SECONDS: '0',
      }),
    );
    prisma = app.get(PrismaService);
    await prisma.formSubmission.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
    const headers = {
      authorization: `Bearer ${await identity.tokenFor(OWNER)}`,
      'x-store-id': STORE,
    };
    const created = await app.inject({
      method: 'POST',
      url: '/orders/forms',
      headers,
      payload: FORM,
    });
    key = OrderFormSchema.parse(created.json()).key;
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    await shipping?.close();
  });

  it('turns a submission into a new order priced by the store', async () => {
    const utm = { source: 'facebook', campaign: 'ete-2026' };
    const res = await submit(order('0555 00 02 01', { utm }));

    expect(res.statusCode).toBe(201);
    const body = SubmitFormOrderResponseSchema.parse(res.json());
    expect(body).toMatchObject({ subtotal: 7000, shippingFee: 400, total: 7400 });
    const saved = await prisma.order.findFirstOrThrow({
      where: { storeId: STORE, ref: body.ref },
      include: { items: true },
    });
    expect(saved).toMatchObject({
      source: 'form',
      status: 'new',
      shippingFee: 400,
      codAmount: 7400,
    });
    expect(saved.items[0]).toMatchObject({ productId: 'sac', name: 'Sac (M)', quantity: 2 });
    const log = await prisma.formSubmission.findFirstOrThrow({ where: { orderId: saved.id } });
    expect(log).toMatchObject({
      outcome: 'created',
      utmSource: 'facebook',
      utmCampaign: 'ete-2026',
    });
  });

  it('refuses the same phone ordering the same product again', async () => {
    const res = await submit(order('0555 00 02 01'), '203.0.113.2');

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: { code: 'forms.duplicate' } });
  });

  it('refuses a filled honeypot without creating an order', async () => {
    const res = await submit(order('0555 00 02 02', { website: 'http://bot' }), '203.0.113.3');

    expect(res.statusCode).toBe(400);
    expect(
      await prisma.order.count({ where: { storeId: STORE, customerPhone: '+213555000202' } }),
    ).toBe(0);
  });

  it('limits submissions from one address per hour', async () => {
    const codes: number[] = [];
    for (let i = 0; i < 6; i += 1)
      codes.push((await submit(order(`0555 00 03 0${i}`), '203.0.113.4')).statusCode);

    expect(codes).toEqual([201, 201, 201, 201, 201, 429]);
  });

  it('refuses picks the form or the store does not offer', async () => {
    const variant = await submit(order('0555 00 04 01', { variant: 'XL' }), '203.0.113.5');
    const wilaya = await submit(
      order('0555 00 04 02', { wilayaCode: 33, communeId: 3301 }),
      '203.0.113.5',
    );

    expect(variant.json()).toMatchObject({ error: { code: 'forms.invalid_product' } });
    expect(wilaya.json()).toMatchObject({ error: { code: 'forms.delivery_unavailable' } });
  });
});
