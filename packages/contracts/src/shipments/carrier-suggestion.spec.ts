import { describe, expect, it } from 'vitest';
import {
  SuggestCarrierQuerySchema,
  SuggestionSettingsSchema,
} from './carrier-suggestion.schema.js';

describe('carrier suggestion contract', () => {
  it('reads the query string', () => {
    expect(
      SuggestCarrierQuerySchema.parse({
        originWilayaCode: '16',
        wilayaCode: '31',
        deliveryType: 'home',
      }),
    ).toEqual({ originWilayaCode: 16, wilayaCode: 31, deliveryType: 'home' });
  });

  it('balances price and reliability by default, with no rules', () => {
    expect(SuggestionSettingsSchema.parse({})).toEqual({
      weights: { price: 5, reliability: 5, speed: 2 },
      rules: [],
    });
  });

  it('refuses all-zero weights and codes out of range in rules', () => {
    const zero = { weights: { price: 0, reliability: 0, speed: 0 } };
    const badRule = { rules: [{ wilayaCodes: [100], carrier: 'yalidine' }] };

    expect(SuggestionSettingsSchema.safeParse(zero).success).toBe(false);
    expect(SuggestionSettingsSchema.safeParse(badRule).success).toBe(false);
  });
});
