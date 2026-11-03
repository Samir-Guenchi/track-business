import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  STORE_LEGAL_EVENTS,
  StoreLegalProfileSchema,
  missingForInvoice,
} from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { IdentityClient } from '../../test/identity-client.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];

describe.skipIf(!baseUrl || !redisUrl)('store legal profile (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=identity_legal_test`;
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let client: IdentityClient;
  const tokens = { owner: '', other: '' };
  let storeId = '';

  const get = (token: string) => client.call('GET', '/stores/current/legal', { token, storeId });
  const patch = (token: string, body: Record<string, unknown>) =>
    client.call('PATCH', '/stores/current/legal', { token, storeId, body });

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
    tokens.owner = await client.signUp('owner.legal@example.dz', 'Karim Owner');
    tokens.other = await client.signUp('other.legal@example.dz', 'Nadia Other');
    storeId = (
      await client.call('POST', '/stores', { token: tokens.owner, body: { name: 'Boutique L' } })
    ).json().id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('starts empty and lists what invoices still need', async () => {
    const empty = StoreLegalProfileSchema.parse((await get(tokens.owner)).json());
    expect(missingForInvoice(empty)).toContain('nif');
  });

  it('saves the fields sent, keeps the others and announces the change', async () => {
    await patch(tokens.owner, { regime: 'auto_entrepreneur', legalName: 'Amina Test' });
    const saved = await patch(tokens.owner, {
      taxRegime: 'ifu',
      address: 'Cité 100 logements, Oran',
      nif: '0000 0000 0000 000',
      autoEntrepreneurCard: 'AE-31-000000',
    });
    const profile = StoreLegalProfileSchema.parse(saved.json());
    expect(profile).toMatchObject({ legalName: 'Amina Test', nif: '000000000000000' });
    expect(missingForInvoice(profile)).toEqual([]);
    const events = await prisma.outboxEvent.findMany({ orderBy: { occurredAt: 'asc' } });
    expect(events.map((event) => event.type)).toEqual([
      STORE_LEGAL_EVENTS.legalUpdated,
      STORE_LEGAL_EVENTS.legalUpdated,
    ]);
  });

  it('refuses a bad NIF, an empty change and other stores', async () => {
    expect((await patch(tokens.owner, { nif: '12AB' })).statusCode).toBe(400);
    expect((await patch(tokens.owner, {})).statusCode).toBe(400);
    expect((await get(tokens.other)).statusCode).toBe(403);
  });
});
