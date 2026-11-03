import { describe, expect, it } from 'vitest';
import {
  type StoreLegalProfile,
  StoreLegalProfileSchema,
  UpdateStoreLegalProfileRequestSchema,
  missingForInvoice,
} from './store-legal.schema.js';

const EMPTY: StoreLegalProfile = StoreLegalProfileSchema.parse({
  regime: null,
  taxRegime: null,
  legalName: null,
  address: null,
  nif: null,
  nis: null,
  rcNumber: null,
  autoEntrepreneurCard: null,
  articleImposition: null,
  updatedAt: null,
});

describe('UpdateStoreLegalProfileRequestSchema', () => {
  it('strips spaces from the tax numbers', () => {
    const parsed = UpdateStoreLegalProfileRequestSchema.parse({ nif: '0001 1600 0000 000' });
    expect(parsed.nif).toBe('000116000000000');
  });

  it('refuses a NIF with letters and an empty change', () => {
    expect(UpdateStoreLegalProfileRequestSchema.safeParse({ nif: '12AB' }).success).toBe(false);
    expect(UpdateStoreLegalProfileRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('missingForInvoice', () => {
  it('asks a merchant for the commercial register', () => {
    expect(missingForInvoice({ ...EMPTY, regime: 'merchant' })).toEqual([
      'taxRegime',
      'legalName',
      'address',
      'nif',
      'rcNumber',
    ]);
  });

  it('asks an auto-entrepreneur for the card instead', () => {
    const profile: StoreLegalProfile = {
      ...EMPTY,
      regime: 'auto_entrepreneur',
      taxRegime: 'ifu',
      legalName: 'Amina B.',
      address: 'Cité 100 logements, Oran',
      nif: '000000000000000',
    };
    expect(missingForInvoice(profile)).toEqual(['autoEntrepreneurCard']);
  });
});
