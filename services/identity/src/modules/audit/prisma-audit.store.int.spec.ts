import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createAuditEntry, retentionCutoffs } from '@trackecom/audit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { testEnv } from '../../test/test-app.js';
import { PrismaAuditStore } from './prisma-audit.store.js';

const baseUrl = process.env['TEST_DATABASE_URL'];

describe.skipIf(!baseUrl)('PrismaAuditStore (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=identity_audit_test`;
  let prisma: PrismaService;
  let store: PrismaAuditStore;
  let clock = new Date('2026-10-31T12:00:00Z');

  const record = (storeId: string, entityId: string, at: Date) => {
    clock = at;
    const deps = { newId: randomUUID, now: () => clock };
    const actor = { type: 'user', id: 'usr_1' } as const;
    const entry = createAuditEntry(
      {
        storeId,
        entity: 'membership',
        entityId,
        action: 'membership.role_changed',
        actor,
        before: { role: 'agent' },
        after: { role: 'manager' },
        ip: '198.51.100.7',
      },
      deps,
    );
    return store.record(entry);
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    prisma = new PrismaService(testEnv({ DATABASE_URL: databaseUrl }));
    store = new PrismaAuditStore(prisma);
    await prisma.auditEvent.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('pages one record timeline newest first, scoped to its store', async () => {
    await record('store_a', 'mem_1', new Date('2026-10-01T10:00:00Z'));
    await record('store_a', 'mem_1', new Date('2026-10-02T10:00:00Z'));
    await record('store_a', 'mem_1', new Date('2026-10-03T10:00:00Z'));
    await record('store_b', 'mem_1', new Date('2026-10-04T10:00:00Z'));

    const first = await store.list({
      storeId: 'store_a',
      entity: 'membership',
      entityId: 'mem_1',
      limit: 2,
    });
    const second = await store.list({
      storeId: 'store_a',
      entity: 'membership',
      entityId: 'mem_1',
      limit: 2,
      cursor: first.nextCursor ?? '',
    });

    expect(first.items.map((e) => e.occurredAt.slice(0, 10))).toEqual(['2026-10-03', '2026-10-02']);
    expect(second.items.map((e) => e.occurredAt.slice(0, 10))).toEqual(['2026-10-01']);
    expect(second.nextCursor).toBeNull();
  });

  it('never returns another store’s events', async () => {
    const page = await store.list({
      storeId: 'store_c',
      entity: 'membership',
      entityId: 'mem_1',
      limit: 10,
    });

    expect(page.items).toEqual([]);
  });

  it('clears old IPs and deletes expired events', async () => {
    await record('store_a', 'mem_old', new Date('2023-01-01T00:00:00Z'));
    await record('store_a', 'mem_mid', new Date('2026-06-01T00:00:00Z'));

    const result = await store.applyRetention(retentionCutoffs(new Date('2026-10-31T00:00:00Z')));

    expect(result).toEqual({ deleted: 1, anonymised: 1 });
  });
});
