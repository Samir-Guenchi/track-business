import type { Payout } from '@trackecom/contracts';
import type { PayoutRecord } from '../application/ports/payout.repository.js';
import { transferGap } from '../domain/payout-statement.js';

export const toPayoutDto = (payout: PayoutRecord): Payout => ({
  id: payout.id,
  status: payout.status,
  carrier: payout.carrier,
  reference: payout.reference,
  paidAt: payout.paidAt.toISOString().slice(0, 10),
  totalAmount: payout.totalAmount,
  codAmount: payout.codAmount,
  fees: payout.fees,
  transferGap: transferGap(payout.totalAmount, payout),
  lines: payout.lineCount,
  matched: payout.matched,
  flagged: payout.flagged,
  importedAt: payout.importedAt.toISOString(),
});
