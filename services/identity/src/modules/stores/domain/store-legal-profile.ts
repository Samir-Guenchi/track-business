import type { StoreLegalProfile, UpdateStoreLegalProfileRequest } from '@trackecom/contracts';

/** A store that never filled its legal profile. */
export const EMPTY_LEGAL_PROFILE: StoreLegalProfile = {
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
};

export type LegalFields = Omit<StoreLegalProfile, 'updatedAt'>;

/** The legal profile after the change: sent fields win, null clears, absent fields stay. */
export function applyLegalChange(
  before: StoreLegalProfile,
  change: UpdateStoreLegalProfileRequest,
): LegalFields {
  return {
    regime: pick(change.regime, before.regime),
    taxRegime: pick(change.taxRegime, before.taxRegime),
    legalName: pick(change.legalName, before.legalName),
    address: pick(change.address, before.address),
    nif: pick(change.nif, before.nif),
    nis: pick(change.nis, before.nis),
    rcNumber: pick(change.rcNumber, before.rcNumber),
    autoEntrepreneurCard: pick(change.autoEntrepreneurCard, before.autoEntrepreneurCard),
    articleImposition: pick(change.articleImposition, before.articleImposition),
  };
}

const pick = <T>(sent: T | null | undefined, stored: T | null): T | null =>
  sent === undefined ? stored : sent;
