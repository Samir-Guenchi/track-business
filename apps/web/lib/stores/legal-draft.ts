import type {
  LegalRegime,
  StoreLegalProfile,
  TaxRegime,
  UpdateStoreLegalProfileRequest,
} from '@trackecom/contracts';

export const LEGAL_TEXT_FIELDS = [
  'legalName',
  'address',
  'nif',
  'nis',
  'rcNumber',
  'autoEntrepreneurCard',
  'articleImposition',
] as const;
export type LegalTextField = (typeof LEGAL_TEXT_FIELDS)[number];

export type LegalDraft = Record<LegalTextField, string> & {
  readonly regime: LegalRegime | undefined;
  readonly taxRegime: TaxRegime | undefined;
};

export const legalDraftOf = (profile: StoreLegalProfile): LegalDraft => ({
  regime: profile.regime ?? undefined,
  taxRegime: profile.taxRegime ?? undefined,
  ...(Object.fromEntries(LEGAL_TEXT_FIELDS.map((field) => [field, profile[field] ?? ''])) as Record<
    LegalTextField,
    string
  >),
});

/** The draft as the API stores it: a blank field is null. */
const asStored = (draft: LegalDraft): Record<string, unknown> => ({
  regime: draft.regime ?? null,
  taxRegime: draft.taxRegime ?? null,
  ...Object.fromEntries(
    LEGAL_TEXT_FIELDS.map((field) => [
      field,
      draft[field].trim() === '' ? null : draft[field].trim(),
    ]),
  ),
});

/** Only what the seller changed; null when nothing did. */
export function legalChange(
  draft: LegalDraft,
  saved: StoreLegalProfile,
): UpdateStoreLegalProfileRequest | null {
  const next = asStored(draft);
  const before = asStored(legalDraftOf(saved));
  const keys = Object.keys(next).filter((key) => next[key] !== before[key]);
  if (keys.length === 0) return null;
  return Object.fromEntries(keys.map((key) => [key, next[key]])) as UpdateStoreLegalProfileRequest;
}
