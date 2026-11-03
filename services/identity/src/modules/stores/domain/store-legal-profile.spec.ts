import { describe, expect, it } from 'vitest';
import { EMPTY_LEGAL_PROFILE, applyLegalChange } from './store-legal-profile.js';

describe('applyLegalChange', () => {
  const before = { ...EMPTY_LEGAL_PROFILE, legalName: 'SARL Test', nif: '000000000000000' };

  it('keeps the fields that were not sent', () => {
    expect(applyLegalChange(before, { address: 'Rue 1, Alger' })).toMatchObject({
      legalName: 'SARL Test',
      nif: '000000000000000',
      address: 'Rue 1, Alger',
    });
  });

  it('clears a field sent as null and drops updatedAt', () => {
    const after = applyLegalChange(before, { nif: null });
    expect(after.nif).toBeNull();
    expect(after).not.toHaveProperty('updatedAt');
  });
});
