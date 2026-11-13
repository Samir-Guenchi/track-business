import { describe, expect, it } from 'vitest';
import { DEFAULT_FORM_LIMITS, FormLimitsSchema } from './form-limits.schema.js';

describe('FormLimitsSchema', () => {
  it('accepts the defaults and stricter limits', () => {
    expect(FormLimitsSchema.safeParse(DEFAULT_FORM_LIMITS).success).toBe(true);
    expect(
      FormLimitsSchema.safeParse({ perIpPerHour: 2, perPhonePerHour: 1, duplicateWindowHours: 72 })
        .success,
    ).toBe(true);
  });

  it('refuses limits looser than the platform', () => {
    const looser = [
      { ...DEFAULT_FORM_LIMITS, perIpPerHour: DEFAULT_FORM_LIMITS.perIpPerHour + 1 },
      { ...DEFAULT_FORM_LIMITS, perPhonePerHour: DEFAULT_FORM_LIMITS.perPhonePerHour + 1 },
      { ...DEFAULT_FORM_LIMITS, duplicateWindowHours: 12 },
      { ...DEFAULT_FORM_LIMITS, perPhonePerHour: 0 },
    ];
    for (const limits of looser) expect(FormLimitsSchema.safeParse(limits).success).toBe(false);
  });
});
