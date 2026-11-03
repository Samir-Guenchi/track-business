import { randomInt, timingSafeEqual } from 'node:crypto';

/** After this many wrong codes the parcel stays locked until the seller looks at it. */
export const MAX_CODE_ATTEMPTS = 5;

/** Six random digits the customer reads out at the shop. */
export const newPickupCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

/** Constant-time comparison so the code cannot be guessed digit by digit. */
export function codeMatches(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A parcel the shop may receive: on its way, not delivered, returned or cancelled. */
const DROPPABLE = new Set(['picked_up', 'in_transit', 'out_for_delivery', 'failed_attempt']);
export const isDroppable = (status: string): boolean => DROPPABLE.has(status);

/** "2026-11" -> [1 Nov 00:00, 1 Dec 00:00) in Algiers time (UTC+1). */
export function monthRange(month: string): { from: Date; to: Date } {
  const [year, monthIndex] = month.split('-').map(Number);
  const from = new Date(Date.UTC(year ?? 1970, (monthIndex ?? 1) - 1, 1, -1));
  const to = new Date(Date.UTC(year ?? 1970, monthIndex ?? 1, 1, -1));
  return { from, to };
}
