import type { ClaimState, ParcelStatus } from '@trackecom/contracts';

/** A claim moves forward only: prepared, sent to the carrier, then answered. */
const NEXT: Readonly<Record<ClaimState, readonly ClaimState[]>> = {
  open: ['submitted'],
  submitted: ['won', 'rejected'],
  won: [],
  rejected: [],
};

/** The carrier never had these parcels in hand, so there is nothing to claim. */
const NOT_HANDED_OVER: readonly ParcelStatus[] = ['created', 'cancelled'];

export type ClaimRefusal = 'not_handed_over' | 'bad_transition' | 'recovered_without_win';

export function openingRefusal(status: ParcelStatus): ClaimRefusal | null {
  return NOT_HANDED_OVER.includes(status) ? 'not_handed_over' : null;
}

export interface Transition {
  readonly from: ClaimState;
  readonly to: ClaimState;
  readonly recovered: number | undefined;
}

export function transitionRefusal({ from, to, recovered }: Transition): ClaimRefusal | null {
  if (!NEXT[from].includes(to)) return 'bad_transition';
  if (recovered !== undefined && to !== 'won') return 'recovered_without_win';
  return null;
}

/** The dates a transition stamps: when it was sent, and when the carrier answered. */
export function stampsFor(to: ClaimState, at: Date): { submittedAt?: Date; closedAt?: Date } {
  if (to === 'submitted') return { submittedAt: at };
  if (to === 'won' || to === 'rejected') return { closedAt: at };
  return {};
}
