import type { StoreLegalProfile } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { legalChange, legalDraftOf } from './legal-draft';

const saved: StoreLegalProfile = {
  regime: 'merchant',
  taxRegime: null,
  legalName: 'Boutique Test',
  address: null,
  nif: null,
  nis: null,
  rcNumber: null,
  autoEntrepreneurCard: null,
  articleImposition: null,
  updatedAt: null,
};

describe('legalChange', () => {
  it('is null when nothing changed', () => {
    expect(legalChange(legalDraftOf(saved), saved)).toBeNull();
  });

  it('sends the edited fields only, blanks as null', () => {
    const draft = {
      ...legalDraftOf(saved),
      legalName: '  ',
      nif: '000 000',
      taxRegime: 'ifu' as const,
    };
    expect(legalChange(draft, saved)).toEqual({
      legalName: null,
      nif: '000 000',
      taxRegime: 'ifu',
    });
  });
});
