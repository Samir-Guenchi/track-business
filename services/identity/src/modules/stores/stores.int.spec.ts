import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListAuditResponseSchema,
  ListMembersResponseSchema,
  MyStoresResponseSchema,
} from '@trackecom/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { IdentityClient } from '../../test/identity-client.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];

describe.skipIf(!baseUrl || !redisUrl)('stores, roles and tenant isolation (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=identity_stores_test`;
  let app: NestFastifyApplication;
  let client: IdentityClient;
  const tokens = { ownerA: '', ownerB: '', agent: '' };
  const stores = { a: '', b: '' };
  let agentMembershipId = '';

  const memberIdOf = async (token: string, storeId: string, email: string) => {
    const response = await client.call('GET', '/stores/current/members', { token, storeId });
    return (
      ListMembersResponseSchema.parse(response.json()).items.find((m) => m.email === email)
        ?.membershipId ?? ''
    );
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    app = await startTestApp(
      testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, RATE_LIMIT_PER_MINUTE: '1000' }),
    );
    await app.get(PrismaService).user.deleteMany();
    await app.get(PrismaService).store.deleteMany();
    client = new IdentityClient(app);
    tokens.ownerA = await client.signUp('owner.a@example.dz', 'Karim Owner');
    tokens.ownerB = await client.signUp('owner.b@example.dz', 'Nadia Owner');
    tokens.agent = await client.signUp('agent@example.dz', 'Yacine Agent');
    stores.a = (
      await client.call('POST', '/stores', { token: tokens.ownerA, body: { name: 'Boutique A' } })
    ).json().id;
    stores.b = (
      await client.call('POST', '/stores', { token: tokens.ownerB, body: { name: 'Boutique B' } })
    ).json().id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('makes the creator the owner of the new store', async () => {
    const response = await client.call('GET', '/stores', { token: tokens.ownerA });

    expect(MyStoresResponseSchema.parse(response.json()).items).toEqual([
      expect.objectContaining({ role: 'owner' }),
    ]);
  });

  it('refuses a store route without x-store-id, and with a store the user is not in', async () => {
    const missing = await client.call('GET', '/stores/current/members', { token: tokens.ownerA });
    const otherStore = await client.call('GET', '/stores/current/members', {
      token: tokens.ownerA,
      storeId: stores.b,
    });

    expect([missing.statusCode, otherStore.statusCode]).toEqual([403, 403]);
  });

  it('invites by email and lets only the invited, verified address accept', async () => {
    const invite = await client.call('POST', '/stores/current/invitations', {
      token: tokens.ownerA,
      storeId: stores.a,
      body: { email: 'agent@example.dz', role: 'agent' },
    });
    const token = client.lastToken('store_invitation', 'agent@example.dz');

    const wrongPerson = await client.call('POST', '/invitations/accept', {
      token: tokens.ownerB,
      body: { token },
    });
    const accepted = await client.call('POST', '/invitations/accept', {
      token: tokens.agent,
      body: { token },
    });
    agentMembershipId = await memberIdOf(tokens.ownerA, stores.a, 'agent@example.dz');

    expect([invite.statusCode, wrongPerson.statusCode, accepted.statusCode]).toEqual([
      201, 403, 201,
    ]);
    expect(agentMembershipId).not.toBe('');
  });

  it('applies the permission matrix: an agent cannot manage members or read the audit log', async () => {
    const invite = await client.call('POST', '/stores/current/invitations', {
      token: tokens.agent,
      storeId: stores.a,
      body: { phone: '0555000003', role: 'packer' },
    });
    const audit = await client.call('GET', `/audit?entity=membership&id=${agentMembershipId}`, {
      token: tokens.agent,
      storeId: stores.a,
    });

    expect([invite.statusCode, audit.statusCode]).toEqual([403, 403]);
  });

  it('cannot touch a membership of store A from store B (IDOR)', async () => {
    const response = await client.call('PATCH', `/stores/current/members/${agentMembershipId}`, {
      token: tokens.ownerB,
      storeId: stores.b,
      body: { role: 'manager' },
    });

    expect(response.json()).toMatchObject({ error: { code: 'stores.member_not_found' } });
  });

  it('records role changes in the store audit trail', async () => {
    await client.call('PATCH', `/stores/current/members/${agentMembershipId}`, {
      token: tokens.ownerA,
      storeId: stores.a,
      body: { role: 'manager' },
    });

    const response = await client.call('GET', `/audit?entity=membership&id=${agentMembershipId}`, {
      token: tokens.ownerA,
      storeId: stores.a,
    });

    const [latest] = ListAuditResponseSchema.parse(response.json()).items;
    expect(latest).toMatchObject({
      action: 'membership.role_changed',
      changes: [{ field: 'role', before: 'agent', after: 'manager' }],
    });
  });

  it('does not let a manager create another manager', async () => {
    const response = await client.call('POST', '/stores/current/invitations', {
      token: tokens.agent,
      storeId: stores.a,
      body: { email: 'x@example.dz', role: 'manager' },
    });

    expect(response.json()).toMatchObject({ error: { code: 'stores.role_change_not_allowed' } });
  });

  it('transfers ownership; the previous owner becomes a manager and cannot transfer again', async () => {
    const transfer = await client.call('POST', '/stores/current/transfer-ownership', {
      token: tokens.ownerA,
      storeId: stores.a,
      body: { membershipId: agentMembershipId },
    });
    const again = await client.call('POST', '/stores/current/transfer-ownership', {
      token: tokens.ownerA,
      storeId: stores.a,
      body: { membershipId: agentMembershipId },
    });
    const roles = await client.call('GET', '/stores', { token: tokens.ownerA });

    expect([transfer.statusCode, again.statusCode]).toEqual([204, 403]);
    expect(MyStoresResponseSchema.parse(roles.json()).items[0]?.role).toBe('manager');
  });
});
