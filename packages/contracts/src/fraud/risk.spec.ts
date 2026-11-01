import { describe, expect, it } from 'vitest';
import { ListOrdersQuerySchema } from '../orders/order-actions.schema.js';
import { RiskScoreSchema } from './risk-score.schema.js';
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

describe('risk score contract', () => {
  const reason = {
    code: 'night_order',
    points: 5,
    params: {},
    text: { ar: 'طلب ليلي', fr: 'Commande de nuit', en: 'Night order' },
  };
  const score = {
    orderId: '50505050-5050-4050-8050-505050505050',
    score: 42,
    level: 'medium',
    reasons: [reason],
    model: 'rules-v1',
  };

  it('accepts a score with its reasons', () => {
    expect(RiskScoreSchema.parse(score)).toEqual(score);
  });

  it('keeps at most three reasons and a 0-100 score', () => {
    expect(RiskScoreSchema.safeParse({ ...score, reasons: Array(4).fill(reason) }).success).toBe(
      false,
    );
    expect(RiskScoreSchema.safeParse({ ...score, score: 101 }).success).toBe(false);
  });
});
