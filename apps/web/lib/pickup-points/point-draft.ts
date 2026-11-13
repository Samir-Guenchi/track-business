import {
  type PickupPoint,
  type PickupPointInput,
  PickupPointInputSchema,
} from '@trackecom/contracts';

/** The shop form as typed: every field a string until it is saved. */
export interface PointDraft {
  readonly name: string;
  readonly wilayaCode: string;
  readonly communeId: string;
  readonly address: string;
  readonly phone: string;
  readonly hours: string;
  readonly capacity: string;
  readonly feePerParcel: string;
  readonly active: boolean;
}

export const emptyDraft: PointDraft = {
  name: '',
  wilayaCode: '',
  communeId: '',
  address: '',
  phone: '',
  hours: '',
  capacity: '20',
  feePerParcel: '100',
  active: true,
};

export const draftOf = (point: PickupPoint): PointDraft => ({
  name: point.name,
  wilayaCode: String(point.wilayaCode),
  communeId: String(point.communeId),
  address: point.address,
  phone: point.phone,
  hours: point.hours,
  capacity: String(point.capacity),
  feePerParcel: String(point.feePerParcel),
  active: point.active,
});

/** The request body, or the names of the fields to fix. */
export function toPointInput(
  draft: PointDraft,
): { input: PickupPointInput } | { invalid: string[] } {
  const parsed = PickupPointInputSchema.safeParse({
    ...draft,
    wilayaCode: Number(draft.wilayaCode),
    communeId: Number(draft.communeId),
    capacity: Number(draft.capacity),
    feePerParcel: Number(draft.feePerParcel),
  });
  if (parsed.success) return { input: parsed.data };
  return { invalid: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))] };
}

/** "2026-11" for the month of `at` in Algiers time. */
export const currentMonth = (at: Date): string =>
  new Date(at.getTime() + 3_600_000).toISOString().slice(0, 7);
