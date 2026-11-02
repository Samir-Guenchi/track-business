import type { ClaimCandidate, ListClaimCandidatesQuery } from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { CANDIDATE_FIELDS, toCandidate } from './claim-rows.js';

const DAY = 24 * 60 * 60 * 1000;
/** Each kind is capped: a store with hundreds of candidates has a carrier problem, not a list problem. */
const PER_KIND = 100;
/** With the carrier and not final: these can go quiet. */
const ACTIVE = ['picked_up', 'in_transit', 'out_for_delivery', 'failed_attempt', 'returning'];

/** No tracking event since `cutoff` (or none at all, and handed over before it). */
const quietSince = (cutoff: Date): Prisma.ShipmentWhereInput => ({
  OR: [{ lastEventAt: { lt: cutoff } }, { lastEventAt: null, createdAt: { lt: cutoff } }],
});

/** Parcels that look claimable (#139) and have no claim yet, the longest-waiting first. */
export async function claimCandidates(
  prisma: PrismaService,
  storeId: string,
  { query, now }: { query: ListClaimCandidatesQuery; now: Date },
): Promise<ClaimCandidate[]> {
  const base = { storeId, claim: { is: null } } satisfies Prisma.ShipmentWhereInput;
  const find = (where: Prisma.ShipmentWhereInput) =>
    prisma.shipment.findMany({
      where: { ...base, ...where },
      select: CANDIDATE_FIELDS,
      take: PER_KIND,
    });
  const [stuck, missing, damaged] = await Promise.all([
    find({
      status: { in: ACTIVE },
      ...quietSince(new Date(now.getTime() - query.stuckDays * DAY)),
    }),
    find({
      status: 'returned',
      returnReceipt: { is: null },
      ...quietSince(new Date(now.getTime() - query.returnMissingDays * DAY)),
    }),
    find({ returnReceipt: { is: { condition: { in: ['damaged', 'incomplete'] } } } }),
  ]);
  return [
    ...stuck.map(toCandidate('stuck')),
    ...missing.map(toCandidate('return_missing')),
    ...damaged.map(toCandidate('damaged')),
  ].sort((a, b) => a.since.localeCompare(b.since));
}
