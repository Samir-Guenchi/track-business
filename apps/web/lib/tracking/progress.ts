import type { ParcelStatus } from '@trackecom/contracts';

/** The happy path the customer sees as a progress bar. */
export const PROGRESS_STEPS = [
  'created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
] as const satisfies readonly ParcelStatus[];

export type ProgressTone = 'on_track' | 'attention' | 'stopped';

export interface Progress {
  /** Index of the last step reached in PROGRESS_STEPS. */
  readonly reached: number;
  readonly tone: ProgressTone;
}

const OFF_PATH: Readonly<Partial<Record<ParcelStatus, Progress>>> = {
  // A failed attempt happens while out for delivery; another one usually follows.
  failed_attempt: { reached: 3, tone: 'attention' },
  returning: { reached: 2, tone: 'stopped' },
  returned: { reached: 2, tone: 'stopped' },
  cancelled: { reached: 0, tone: 'stopped' },
};

export function progressOf(status: ParcelStatus): Progress {
  const offPath = OFF_PATH[status];
  if (offPath) return offPath;
  const reached = (PROGRESS_STEPS as readonly ParcelStatus[]).indexOf(status);
  return { reached: Math.max(0, reached), tone: 'on_track' };
}
