import type { DailyVolume, StoreProfile, UpdateStoreProfileRequest } from '@trackecom/contracts';

export interface ProfileDraft {
  readonly originWilayaCode: number | undefined;
  readonly originCommuneId: number | undefined;
  readonly contactPhone: string;
  readonly dailyVolume: DailyVolume | undefined;
  readonly carriers: readonly string[];
  readonly defaultLanguage: StoreProfile['defaultLanguage'];
}

export const draftOf = (profile: StoreProfile): ProfileDraft => ({
  originWilayaCode: profile.originWilayaCode ?? undefined,
  originCommuneId: profile.originCommuneId ?? undefined,
  contactPhone: profile.contactPhone ?? '',
  dailyVolume: profile.dailyVolume ?? undefined,
  carriers: profile.carriers,
  defaultLanguage: profile.defaultLanguage,
});

/** The fields the form shows, as the API stores them: empty means null. */
const asStored = (draft: ProfileDraft) => ({
  originWilayaCode: draft.originWilayaCode ?? null,
  originCommuneId: draft.originCommuneId ?? null,
  contactPhone: draft.contactPhone.trim() === '' ? null : draft.contactPhone.trim(),
  dailyVolume: draft.dailyVolume ?? null,
  carriers: [...draft.carriers],
  defaultLanguage: draft.defaultLanguage,
});

/** Only what the seller changed; null when nothing did (the API refuses an empty change). */
export function profileChange(
  draft: ProfileDraft,
  saved: StoreProfile,
): UpdateStoreProfileRequest | null {
  const next = asStored(draft);
  const before = asStored(draftOf(saved));
  const keys = (Object.keys(next) as (keyof typeof next)[]).filter(
    (key) => JSON.stringify(next[key]) !== JSON.stringify(before[key]),
  );
  if (keys.length === 0) return null;
  return Object.fromEntries(keys.map((key) => [key, next[key]])) as UpdateStoreProfileRequest;
}

export const toggleCarrier = (carriers: readonly string[], code: string): string[] =>
  carriers.includes(code) ? carriers.filter((c) => c !== code) : [...carriers, code];
