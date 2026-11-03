import type { StoreLegalProfile } from '@trackecom/contracts';

/** A complete legal profile under the real regime, for tests. */
export const COMPLETE_LEGAL: StoreLegalProfile = {
  regime: 'company',
  taxRegime: 'real',
  legalName: 'SARL Test Facture',
  address: 'Rue des tests, Alger',
  nif: '000000000000000',
  nis: null,
  rcNumber: '16/00-0000000 B 21',
  autoEntrepreneurCard: null,
  articleImposition: null,
  updatedAt: null,
};
