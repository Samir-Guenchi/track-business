import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ExpectedFeesResponseSchema } from '@trackecom/contracts';
import { INTERNAL_TOKEN_HEADER } from '@trackecom/service-kit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19600000-0000-4000-8000-000000000001';
const TOKEN = 'internal-token-for-tests-only-0123456789';

describe.skipIf(!baseUrl || !redisUrl)('expected carrier fees (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_fees_test`;
  let app: NestFastifyApplication;
  const ask = (token: string | undefined, trackingNumbers: string[]) =>
    app.inject({
      method: 'POST',
      url: `/internal/stores/${STORE}/carrier-fees`,
      headers: token ? { [INTERNAL_TOKEN_HEADER]: token } : {},
      payload: { carrier: 'yalidine', trackingNumbers },
    });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    app = await startTestApp(
      testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, INTERNAL_TOKEN: TOKEN }),
    );
    const prisma = app.get(PrismaService);
    await prisma.$transaction([prisma.shipment.deleteMany(), prisma.rateCard.deleteMany()]);
    await prisma.shipment.create({
      data: {
        id: '19600000-0000-4000-8000-000000000041',
        storeId: STORE,
        orderId: '19600000-0000-4000-8000-000000000021',
        carrier: 'yalidine',
        reference: 'ORD-196',
        trackingNumber: 'TRK-196',
        publicCode: 'fees-public-code-000001',
        toWilayaCode: 31,
        deliveryType: 'home',
      },
    });
    await prisma.rateCard.create({
      data: {
        storeId: STORE,
        carrier: 'yalidine',
        fromWilaya: 16,
        toWilaya: 31,
        deliveryType: 'home',
        price: 700,
        returnFee: 250,
        importedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('answers the rate card fees of known parcels and leaves unknown ones out', async () => {
    const response = await ask(TOKEN, ['TRK-196', 'TRK-UNKNOWN']);

    expect(ExpectedFeesResponseSchema.parse(response.json()).items).toEqual([
      {
        trackingNumber: 'TRK-196',
        toWilayaCode: 31,
        deliveryType: 'home',
        deliveryFee: 700,
        returnFee: 250,
      },
    ]);
  });

  it('needs the internal token', async () => {
    expect((await ask(undefined, ['TRK-196'])).statusCode).toBe(401);
  });
});
