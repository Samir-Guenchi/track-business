import { describe, expect, it } from 'vitest';
import { ListOrdersQuerySchema } from '../orders/order-actions.schema.js';
import { CreateBlacklistEntryRequestSchema } from './risk.schema.js';

describe('fraud contract', () => {
  it('blacklists a phone in any spelling', () => {
    const entry = CreateBlacklistEntryRequestSchema.parse({
      phone: '0555 00 00 01',
      reason: 'refused_parcel',
    });

    expect(entry).toMatchObject({ phone: '+213555000001', expiresAt: null });
  });

  it('needs a phone, or a name with its commune', () => {
    const nameOnly = { name: 'Some Name', reason: 'fake_order' };

    expect(CreateBlacklistEntryRequestSchema.safeParse(nameOnly).success).toBe(false);
    expect(
      CreateBlacklistEntryRequestSchema.safeParse({ ...nameOnly, communeId: 1601 }).success,
    ).toBe(true);
  });

  it('filters the order list by risk', () => {
    expect(ListOrdersQuerySchema.parse({ flagged: 'true' })).toMatchObject({ flagged: true });
  });
});
