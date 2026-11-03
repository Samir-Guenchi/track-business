import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ATTEMPT_CHECK_EVENTS,
  AttemptChecksReportSchema,
  PublicAttemptCheckSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19500000-0000-4000-8000-000000000001';
const OWNER = '19500000-0000-4000-8000-000000000011';
const SHIPMENT = '19500000-0000-4000-8000-000000000041';
const EVENT = '19500000-0000-4000-8000-000000000051';
const CODE = 'attempt-public-code-0001';

describe.skipIf(!baseUrl || !redisUrl)('failed-attempt checks (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_attempts_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const publicCall = (method: 'GET' | 'POST', payload?: object) =>
    app.inject({
      method,
      url: `/public/tracking/${CODE}/attempt-check`,
      ...(payload ? { payload } : {}),
    });
  const failedAttempt = (failureReason: string, at = new Date()) =>
    prisma.trackingEvent.create({
      data: {
        id: EVENT,
        shipmentId: SHIPMENT,
        storeId: STORE,
        status: 'failed_attempt',
        carrierStatus: 'Client absent',
        failureReason,
        at,
        dedupeKey: 'attempt-1',
      },
    });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [OWNER]: { [STORE]: 'owner' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.outboxEvent.deleteMany(),
      prisma.attemptAnswer.deleteMany(),
      prisma.shipment.deleteMany(),
    ]);
    await prisma.shipment.create({
      data: {
        id: SHIPMENT,
        storeId: STORE,
        orderId: '19500000-0000-4000-8000-000000000021',
        carrier: 'yalidine',
        reference: 'ORD-195',
        trackingNumber: 'TRK-195',
        publicCode: CODE,
        status: 'failed_attempt',
        toWilayaCode: 16,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('asks about an "absent" attempt and records a "nobody came" once', async () => {
    await failedAttempt('absent');
    const open = PublicAttemptCheckSchema.parse((await publicCall('GET')).json());
    expect(open.check).toMatchObject({ eventId: EVENT, reason: 'absent', answer: null });

    const answer = { eventId: EVENT, answer: 'not_contacted' };
    const answered = await publicCall('POST', answer);
    expect(answered.statusCode).toBe(200);
    expect(answered.json().check.answer).toBe('not_contacted');
    expect((await publicCall('POST', { ...answer, answer: 'contacted' })).statusCode).toBe(409);

    const events = await prisma.outboxEvent.findMany();
    expect(events.map((event) => event.type)).toEqual([ATTEMPT_CHECK_EVENTS.disputed]);
  });

  it('does not ask about a wrong address', async () => {
    await failedAttempt('wrong_address');
    expect((await publicCall('GET')).json()).toEqual({ check: null });
    expect((await publicCall('POST', { eventId: EVENT, answer: 'contacted' })).statusCode).toBe(
      409,
    );
  });

  it('shows the seller disputed attempts per carrier', async () => {
    await failedAttempt('no_answer');
    await publicCall('POST', { eventId: EVENT, answer: 'not_contacted' });

    const response = await app.inject({
      method: 'GET',
      url: '/attempt-checks?days=30',
      headers: {
        authorization: `Bearer ${await identity.tokenFor(OWNER)}`,
        'x-store-id': STORE,
      },
    });

    const report = AttemptChecksReportSchema.parse(response.json());
    expect(report.carriers).toEqual([{ carrier: 'yalidine', answered: 1, disputed: 1 }]);
    expect(report.disputed[0]).toMatchObject({ trackingNumber: 'TRK-195', reason: 'no_answer' });
  });
});
