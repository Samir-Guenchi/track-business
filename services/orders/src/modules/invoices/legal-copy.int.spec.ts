import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  STORE_LEGAL_EVENTS,
  type StoreLegalUpdatedEvent,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { CopyLegalProfileUseCase } from './application/copy-legal-profile.use-case.js';
import { LEGAL_COPIES, type LegalCopyRepository } from './application/ports/legal-copy.port.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '14014014-0140-4140-8140-140140140140';

const legalUpdated = (legalName: string, occurredAt: string): EventEnvelope => {
  const data: StoreLegalUpdatedEvent = {
    storeId: STORE,
    regime: 'merchant',
    taxRegime: 'real',
    legalName,
    address: 'Rue des tests, Alger',
    nif: '000000000000000',
    nis: null,
    rcNumber: '16/00-0000000 B 21',
    autoEntrepreneurCard: null,
    articleImposition: null,
    updatedAt: occurredAt,
  };
  return {
    id: randomUUID(),
    type: STORE_LEGAL_EVENTS.legalUpdated,
    occurredAt,
    storeId: STORE,
    correlationId: randomUUID(),
    data,
  };
};

// Shares the orders API schema: files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('legal profile copy (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let copy: CopyLegalProfileUseCase;
  let copies: LegalCopyRepository;

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({});
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv(env));
    copy = app.get(CopyLegalProfileUseCase);
    copies = app.get(LEGAL_COPIES);
    await app.get(PrismaService).storeLegalCopy.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('keeps the latest profile, even when events arrive out of order', async () => {
    expect(await copy.execute(legalUpdated('SARL Deux', '2026-11-03T10:00:00.000Z'))).toBe(true);
    expect(await copy.execute(legalUpdated('SARL Un', '2026-11-03T09:00:00.000Z'))).toBe(false);
    expect(await copy.execute(legalUpdated('SARL Deux', '2026-11-03T10:00:00.000Z'))).toBe(false);

    expect(await copies.find(STORE)).toMatchObject({ legalName: 'SARL Deux', regime: 'merchant' });
  });

  it('has no copy for a store that never filled its legal profile', async () => {
    expect(await copies.find(randomUUID())).toBeNull();
  });
});
