import { describe, expect, it } from 'vitest';
import { alertQuality, returnsCapturedAtTop } from './evaluation.js';
import { describeReason } from './reason-text.js';
import { type ReturnRiskFacts, type ScoredReason, scoreReturnRisk } from './return-risk.js';

const facts: ReturnRiskFacts = {
  customer: { returned: 0, delivered: 0 },
  wilaya: { finished: 0, returned: 0 },
  codAmount: 3_500,
  createdAt: new Date('2026-11-01T10:00:00Z'),
  unreachedCalls: 0,
  riskFlags: [],
  possibleDuplicate: false,
};

describe('scoreReturnRisk', () => {
  it('scores an ordinary first order low with no reasons', () => {
    expect(scoreReturnRisk(facts)).toEqual({ score: 0, level: 'low', reasons: [] });
  });

  it('weighs a customer who refused before above everything else', () => {
    const risk = scoreReturnRisk({
      ...facts,
      customer: { returned: 2, delivered: 0 },
      codAmount: 32_000,
      createdAt: new Date('2026-11-01T02:30:00Z'),
      unreachedCalls: 3,
    });

    expect(risk.score).toBe(80);
    expect(risk.level).toBe('high');
    expect(risk.reasons.map((reason) => reason.code)).toEqual([
      'customer_returned_before',
      'high_value',
      'hard_to_reach',
    ]);
  });

  it('lowers the score for a customer who received parcels before', () => {
    const risk = scoreReturnRisk({
      ...facts,
      customer: { returned: 1, delivered: 2 },
      riskFlags: ['order_burst'],
    });

    expect(risk.score).toBe(20);
    expect(risk.reasons[1]).toMatchObject({ code: 'customer_delivered_before', points: -20 });
  });

  it('only trusts a wilaya rate from enough parcels', () => {
    const wilaya = { finished: 19, returned: 15 };
    expect(scoreReturnRisk({ ...facts, wilaya }).score).toBe(0);

    const risk = scoreReturnRisk({ ...facts, wilaya: { finished: 40, returned: 18 } });
    expect(risk.reasons).toEqual([
      { code: 'wilaya_return_rate', points: 25, params: { rate: 0.45 } },
    ]);
  });

  it('turns fake-order and network flags into reasons', () => {
    const risk = scoreReturnRisk({
      ...facts,
      riskFlags: ['blacklisted', 'network_refusals'],
      possibleDuplicate: true,
    });

    expect(risk.score).toBe(75);
    expect(risk.reasons.map((reason) => reason.code)).toEqual([
      'fake_order_signal',
      'network_refusals',
      'possible_duplicate',
    ]);
  });
});

describe('describeReason', () => {
  it('words a reason in the three app languages', () => {
    const text = describeReason({
      code: 'customer_returned_before',
      points: 30,
      params: { count: 2 },
    }).text;

    expect(text.en).toBe('This number refused 2 parcel(s) at your store');
    expect(text.fr).toContain('2 colis');
    expect(text.ar).toContain('2');
  });

  it('words the flag behind a fake-order signal', () => {
    const reason: ScoredReason = {
      code: 'fake_order_signal',
      points: 15,
      params: { flag: 'gibberish_name' },
    };
    expect(describeReason(reason).text.en).toBe('Nonsense name');
  });
});

describe('evaluation', () => {
  const outcomes = [
    { score: 90, returned: true },
    { score: 70, returned: true },
    { score: 40, returned: false },
    { score: 30, returned: true },
    { score: 20, returned: false },
    { score: 10, returned: false },
    { score: 10, returned: false },
    { score: 5, returned: false },
    { score: 5, returned: false },
    { score: 0, returned: false },
  ];

  it('measures the share of returns in the riskiest fifth', () => {
    expect(returnsCapturedAtTop(outcomes)).toBeCloseTo(2 / 3);
  });

  it('measures precision and recall at an alert threshold', () => {
    expect(alertQuality(outcomes, 30)).toEqual({ precision: 0.75, recall: 1 });
  });
});
