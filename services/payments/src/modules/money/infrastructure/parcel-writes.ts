import { randomUUID } from 'node:crypto';
import type { ReconciliationStatus } from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import { type Posting, isBalanced } from '../domain/ledger.js';
import { ParcelChangedError } from '../domain/payout.errors.js';

type Tx = Prisma.TransactionClient;

export interface PostingOwner {
  readonly storeId: string;
  readonly parcelId?: string;
  readonly payoutId?: string;
}

/** One balanced ledger entry per group; refuses anything that does not sum to zero. */
export async function writeEntries(
  tx: Tx,
  entries: readonly { owner: PostingOwner; postings: readonly Posting[] }[],
): Promise<void> {
  const rows = entries.flatMap(({ owner, postings }) => {
    if (!isBalanced(postings)) throw new Error('Unbalanced ledger entry');
    const entryId = randomUUID();
    return postings.map((posting) => ({ id: randomUUID(), entryId, ...owner, ...posting }));
  });
  if (rows.length > 0) await tx.ledgerEntry.createMany({ data: rows });
}

/**
 * Creates the parcel (previous status null) or moves it only if it is still in the status it
 * was read in, so a delivery and a payout never both apply the same parcel's money.
 */
export async function writeParcel(
  tx: Tx,
  parcel: ParcelRecord,
  previousStatus: ReconciliationStatus | null,
): Promise<void> {
  if (previousStatus === null) {
    await tx.parcel.create({ data: parcel });
    return;
  }
  const { id, ...fields } = parcel;
  const { count } = await tx.parcel.updateMany({
    where: { id, status: previousStatus },
    data: fields,
  });
  if (count === 0) throw new ParcelChangedError();
}
