import type { ListExpectedReturnsQuery } from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import { type KeysetPosition, decodeKeyset } from '../../../shared/keyset-cursor.js';
import { RETURN_STATUSES, overdueCutoff } from '../domain/return-window.js';

type ShipmentWhere = Prisma.ShipmentWhereInput;

/**
 * Parcels the carrier sent back, and delivered exchanges whose old items the courier took back
 * (#138), that nobody has scanned in yet.
 */
export const outstandingReturns = (storeId: string): ShipmentWhere => ({
  storeId,
  returnReceipt: { is: null },
  OR: [
    { status: { in: [...RETURN_STATUSES] } },
    { status: 'delivered', exchangeCollect: { not: null } },
  ],
});

/** Announced as returning before the cutoff: likely lost if still not here. */
export const announcedBefore = (cutoff: Date): ShipmentWhere => ({
  OR: [
    { events: { some: { status: { in: [...RETURN_STATUSES] }, at: { lt: cutoff } } } },
    {
      exchangeCollect: { not: null },
      events: { some: { status: 'delivered', at: { lt: cutoff } } },
    },
  ],
});

export function expectedWhere(storeId: string, query: ListExpectedReturnsQuery, now: Date) {
  const after = decodeKeyset(query.cursor);
  const filters: ShipmentWhere[] = [
    outstandingReturns(storeId),
    query.carrier ? { carrier: query.carrier } : {},
    query.overdue ? announcedBefore(overdueCutoff(now, query.overdueDays)) : {},
    after ? ascendingAfter(after) : {},
  ];
  return { AND: filters } satisfies ShipmentWhere;
}

/** Keyset on (createdAt, id), oldest first. */
const ascendingAfter = (at: KeysetPosition) => ({
  OR: [{ createdAt: { gt: at.createdAt } }, { createdAt: at.createdAt, id: { gt: at.id } }],
});

/** Keyset on (createdAt, id), newest first. */
export const descendingAfter = (at: KeysetPosition | null) =>
  at
    ? { OR: [{ createdAt: { lt: at.createdAt } }, { createdAt: at.createdAt, id: { lt: at.id } }] }
    : {};
