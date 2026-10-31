import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PAYMENT_EVENTS } from '@trackecom/contracts';
import { outboxMessage } from '../../../shared/outbox-message.js';
import { ParcelChangedError } from '../domain/payout.errors.js';
import { type Reconciliation, reconcile } from '../domain/payout-statement.js';
import { flaggedEvent } from './flagged-event.js';
import {
  type ClaimedPayout,
  PAYOUT_REPOSITORY,
  type PayoutRepository,
} from './ports/payout.repository.js';

/** How long a replica may hold a statement before another one takes it over. */
export const PAYOUT_LEASE_MS = 5 * 60_000;

function eventsFor(payout: ClaimedPayout, result: Reconciliation) {
  // The statement id ties every event of one import together in the logs.
  const origin = { storeId: payout.storeId, correlationId: payout.id, now: new Date() };
  const imported = outboxMessage(origin, PAYMENT_EVENTS.payoutImported, {
    payoutId: payout.id,
    carrier: payout.carrier,
    reference: payout.reference,
    totalAmount: payout.totalAmount,
    matched: result.matched,
    flagged: result.flagged,
  });
  const flagged = result.outcomes.filter((outcome) => outcome.flagged);
  return [imported, ...flagged.map((outcome) => flaggedEvent(origin, outcome.parcel))];
}

/** Background task: matches one imported statement per run against the store's parcels. */
@Injectable()
export class PayoutMatcher {
  readonly name = 'payout matcher';

  constructor(@Inject(PAYOUT_REPOSITORY) private readonly payouts: PayoutRepository) {}

  async runOnce(): Promise<number> {
    const payout = await this.payouts.claimNext(PAYOUT_LEASE_MS);
    if (!payout) return 0;
    const known = await this.payouts.findParcels(payout);
    const parcels = new Map(known.map((parcel) => [parcel.trackingNumber, parcel]));
    const reconciliation = reconcile(payout, parcels, {
      storeId: payout.storeId,
      carrier: payout.carrier,
      payoutId: payout.id,
      paidAt: payout.paidAt,
      newId: randomUUID,
    });
    const outbox = eventsFor(payout, reconciliation);
    try {
      await this.payouts.complete({ payout, reconciliation, outbox });
    } catch (error) {
      if (!(error instanceof ParcelChangedError)) throw error;
      // A delivery landed meanwhile: match again from a fresh read on the next run.
      await this.payouts.release(payout.id);
    }
    return 1;
  }
}
