import type { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import type { PayoutCompletion } from '../application/ports/payout.repository.js';
import { ParcelChangedError } from '../domain/payout.errors.js';
import { writeEntries, writeParcel } from './parcel-writes.js';

/** Applies a matched statement: parcels, one ledger entry per line plus the gap, events. */
export async function writeCompletion(
  tx: Prisma.TransactionClient,
  { payout, reconciliation, outbox }: PayoutCompletion,
): Promise<void> {
  for (const outcome of reconciliation.outcomes) {
    await writeParcel(tx, outcome.parcel, outcome.previousStatus);
  }
  const owner = { storeId: payout.storeId, payoutId: payout.id };
  await writeEntries(tx, [
    ...reconciliation.outcomes.map(({ parcel, postings }) => ({
      owner: { ...owner, parcelId: parcel.id },
      postings,
    })),
    { owner, postings: reconciliation.gapPostings },
  ]);
  const { count } = await tx.payout.updateMany({
    where: { id: payout.id, status: 'processing' },
    data: {
      status: 'reconciled',
      matched: reconciliation.matched,
      flagged: reconciliation.flagged,
      claimedUntil: null,
    },
  });
  // Another replica finished it after our lease ran out: keep its result.
  if (count === 0) throw new ParcelChangedError();
  await writeOutbox(tx, outbox);
}
