import { SuggestionSettingsSchema } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { type CarrierFacts, reliability } from './carrier-facts.js';
import { suggestCarrier } from './carrier-suggestion.js';

const facts = (carrier: string, overrides: Partial<CarrierFacts> = {}): CarrierFacts => ({
  carrier,
  cost: 600,
  store: { delivered: 0, returned: 0 },
  networkRate: null,
  averageDays: null,
  stopDesk: null,
  ...overrides,
});
const input = (settings: object = {}, deliveryType: 'home' | 'stopdesk' = 'home') => ({
  wilayaCode: 31,
  deliveryType,
  settings: SuggestionSettingsSchema.parse(settings),
});

describe('reliability', () => {
  it('trusts the network until the store has its own record', () => {
    expect(reliability(facts('yal', { networkRate: 0.9 }))).toBeCloseTo(0.9);
    const record = facts('yal', { networkRate: 0.9, store: { delivered: 50, returned: 50 } });
    expect(reliability(record)).toBeCloseTo(0.536, 3);
  });
});

describe('suggestCarrier', () => {
  it('suggests the cheapest when everything else is equal', () => {
    const result = suggestCarrier(
      [facts('yal', { cost: 700 }), facts('zr', { cost: 500 })],
      input(),
    );

    expect(result).toMatchObject({ suggested: 'zr', reason: 'cheapest' });
    expect(result.options.map((o) => o.carrier)).toEqual(['zr', 'yal']);
  });

  it('prefers a reliable carrier when the store weighs reliability', () => {
    const shaky = facts('yal', { cost: 500, store: { delivered: 30, returned: 70 } });
    const solid = facts('zr', { cost: 650, store: { delivered: 90, returned: 10 } });
    const weights = { price: 1, reliability: 10, speed: 0 };

    expect(suggestCarrier([shaky, solid], input({ weights }))).toMatchObject({
      suggested: 'zr',
      reason: 'most_reliable',
    });
  });

  it('follows a routing rule over the score', () => {
    const rules = [{ wilayaCodes: [16, 31], carrier: 'yal' }];
    const result = suggestCarrier(
      [facts('yal', { cost: 900 }), facts('zr', { cost: 400 })],
      input({ rules }),
    );

    expect(result).toMatchObject({ suggested: 'yal', reason: 'routing_rule' });
  });

  it('ignores a rule for a carrier that cannot take the parcel', () => {
    const rules = [{ wilayaCodes: [31], carrier: 'yal' }];
    const result = suggestCarrier([facts('yal', { cost: null }), facts('zr')], input({ rules }));

    expect(result).toMatchObject({ suggested: 'zr', reason: 'only_option' });
    expect(result.options.at(-1)).toMatchObject({
      carrier: 'yal',
      unavailable: 'no_rate',
      score: null,
    });
  });

  it('leaves out carriers without a stop desk there for stop-desk parcels', () => {
    const result = suggestCarrier(
      [facts('yal', { stopDesk: false }), facts('zr', { stopDesk: null })],
      input({}, 'stopdesk'),
    );

    expect(result.suggested).toBe('zr');
    expect(result.options[1]).toMatchObject({ unavailable: 'no_stopdesk' });
  });

  it('suggests nothing when no carrier can take the parcel', () => {
    expect(suggestCarrier([facts('yal', { cost: null })], input())).toMatchObject({
      suggested: null,
      reason: null,
    });
  });

  it('reports the store rate, sample and rounded days', () => {
    const record = facts('yal', { store: { delivered: 3, returned: 1 }, averageDays: 2.345 });

    expect(suggestCarrier([record], input()).options[0]).toMatchObject({
      storeDeliveryRate: 0.75,
      storeParcels: 4,
      averageDeliveryDays: 2.3,
    });
  });
});
