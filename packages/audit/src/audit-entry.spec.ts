import { AuditEventSchema } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { createAuditEntry } from './audit-entry.js';
import { toAuditEvent, toAuditRow } from './audit-row.mapper.js';
import { retentionCutoffs } from './retention.js';

const deps = { newId: () => 'aud_1', now: () => new Date('2026-10-31T12:00:00Z') };

describe('audit entries', () => {
  const entry = createAuditEntry(
    {
      storeId: 'store_a',
      entity: 'order',
      entityId: 'ord_1',
      action: 'order.status_changed',
      actor: { type: 'user', id: 'usr_1' },
      before: { status: 'pending' },
      after: { status: 'confirmed' },
      ip: '198.51.100.7',
    },
    deps,
  );

  it('round-trips through the table row into the public contract', () => {
    const event = toAuditEvent(toAuditRow(entry));

    expect(AuditEventSchema.parse(event)).toMatchObject({
      action: 'order.status_changed',
      occurredAt: '2026-10-31T12:00:00.000Z',
    });
  });

  it('does not expose the IP address or the store id', () => {
    const event = toAuditEvent(toAuditRow(entry));

    expect(JSON.stringify(event)).not.toMatch(/198\.51|store_a/);
  });
});

describe('retentionCutoffs', () => {
  it('clears IPs after 90 days and deletes events after 730 days', () => {
    const cutoffs = retentionCutoffs(new Date('2026-10-31T00:00:00Z'));

    expect(cutoffs.clearIpBefore.toISOString()).toBe('2026-08-02T00:00:00.000Z');
    expect(cutoffs.deleteEventsBefore.toISOString()).toBe('2024-10-31T00:00:00.000Z');
  });
});
