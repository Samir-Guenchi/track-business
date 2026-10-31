import { describe, expect, it } from 'vitest';
import { AlgerianPhoneSchema } from './phone.schema.js';

describe('AlgerianPhoneSchema', () => {
  it.each(['0555 00 00 01', '+213555000001', '00213-555-000-001', '0555.00.00.01'])(
    'normalises %s',
    (input) => {
      expect(AlgerianPhoneSchema.parse(input)).toBe('+213555000001');
    },
  );

  it.each(['0255000001', '+33612345678', '055500000', 'abc'])('rejects %s', (input) => {
    expect(AlgerianPhoneSchema.safeParse(input).success).toBe(false);
  });
});
