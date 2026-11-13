import type { StoreProfile, UpdateStoreProfileRequest } from '@trackecom/contracts';

/** A store that never filled its profile: French, nothing else known. */
export const EMPTY_PROFILE: StoreProfile = {
  originWilayaCode: null,
  originCommuneId: null,
  contactPhone: null,
  logoUrl: null,
  dailyVolume: null,
  carriers: [],
  defaultLanguage: 'fr',
  updatedAt: null,
};

type ProfileFields = Omit<StoreProfile, 'updatedAt' | 'logoUrl'>;

/** The profile after the change; a new wilaya without a commune drops the old commune. */
export function applyProfileChange(
  before: StoreProfile,
  change: UpdateStoreProfileRequest,
): ProfileFields {
  const wilayaMoved =
    change.originWilayaCode !== undefined && change.originWilayaCode !== before.originWilayaCode;
  const keepCommune = !wilayaMoved || change.originCommuneId !== undefined;
  return {
    originWilayaCode: pick(change.originWilayaCode, before.originWilayaCode),
    originCommuneId: keepCommune ? pick(change.originCommuneId, before.originCommuneId) : null,
    contactPhone: pick(change.contactPhone, before.contactPhone),
    dailyVolume: pick(change.dailyVolume, before.dailyVolume),
    carriers: change.carriers ?? before.carriers,
    defaultLanguage: change.defaultLanguage ?? before.defaultLanguage,
  };
}

/** The sent value, null included; the stored one when the field was not sent. */
const pick = <T>(sent: T | null | undefined, stored: T | null): T | null =>
  sent === undefined ? stored : sent;

/** Only the fields that changed, for the audit log. */
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const keys = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return {
    before: Object.fromEntries(keys.map((key) => [key, before[key]])),
    after: Object.fromEntries(keys.map((key) => [key, after[key]])),
  };
}
