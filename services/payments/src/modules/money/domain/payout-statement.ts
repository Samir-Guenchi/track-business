import type { PayoutLineInput } from '@trackecom/contracts';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import { type Posting, transferGapPostings } from './ledger.js';
import { type LineContext, type LineOutcome, matchLine } from './payout-matching.js';

export interface StatementTotals {
  readonly codAmount: number;
  readonly fees: number;
  readonly lineCount: number;
}

export function statementTotals(lines: readonly PayoutLineInput[]): StatementTotals {
  return lines.reduce(
    (sum, line) => ({
      codAmount: sum.codAmount + line.codAmount,
      fees: sum.fees + line.shippingFee + line.returnFee,
      lineCount: sum.lineCount + 1,
    }),
    { codAmount: 0, fees: 0, lineCount: 0 },
  );
}

/** What the carrier sent minus what its lines add up to; non-zero means the statement is off. */
export const transferGap = (totalAmount: number, totals: StatementTotals): number =>
  totalAmount - (totals.codAmount - totals.fees);

/** Tracking numbers listed twice on one statement: such a statement is refused. */
export function duplicateTrackingNumbers(lines: readonly PayoutLineInput[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const { trackingNumber } of lines) {
    if (seen.has(trackingNumber)) duplicates.add(trackingNumber);
    seen.add(trackingNumber);
  }
  return [...duplicates];
}

export interface StatementToMatch {
  readonly totalAmount: number;
  readonly lines: readonly PayoutLineInput[];
}

export interface Reconciliation {
  readonly outcomes: readonly LineOutcome[];
  /** Cash that no line explains (the transfer gap), parked in `unallocated`. */
  readonly gapPostings: readonly Posting[];
  readonly matched: number;
  readonly flagged: number;
}

/** Matches every line of a statement against the parcels already known for its carrier. */
export function reconcile(
  statement: StatementToMatch,
  parcels: ReadonlyMap<string, ParcelRecord>,
  context: LineContext,
): Reconciliation {
  const outcomes = statement.lines.map((line) =>
    matchLine(line, parcels.get(line.trackingNumber), context),
  );
  const flagged = outcomes.filter((outcome) => outcome.flagged).length;
  const gap = transferGap(statement.totalAmount, statementTotals(statement.lines));
  return {
    outcomes,
    gapPostings: transferGapPostings(gap),
    matched: outcomes.length - flagged,
    flagged,
  };
}
