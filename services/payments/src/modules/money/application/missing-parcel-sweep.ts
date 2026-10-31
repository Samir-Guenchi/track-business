import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ParcelRecord } from './ports/money.repository.js';
import { OVERDUE_PARCELS, type OverdueParcels } from './ports/money-reads.js';
import { flaggedEvent } from './flagged-event.js';

const BATCH = 500;

/**
 * Background task (#42): a delivered parcel still unpaid after the store's `missingAfterDays`
 * becomes `missing`, and the seller is told to claim it. A later payout line clears it.
 */
@Injectable()
export class MissingParcelSweep {
  readonly name = 'missing parcel sweep';

  constructor(@Inject(OVERDUE_PARCELS) private readonly overdue: OverdueParcels) {}

  runOnce(): Promise<number> {
    const correlationId = randomUUID();
    const outbox = (parcels: readonly ParcelRecord[]) =>
      parcels.map((parcel) =>
        flaggedEvent({ storeId: parcel.storeId, correlationId, now: new Date() }, parcel),
      );
    return this.overdue.flagMissing({ limit: BATCH, outbox });
  }
}
