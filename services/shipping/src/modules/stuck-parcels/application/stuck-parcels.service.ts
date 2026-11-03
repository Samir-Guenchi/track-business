import { Inject, Injectable } from '@nestjs/common';
import type { StuckParcelsQuery, StuckParcelsResponse } from '@trackecom/contracts';
import { type OpenParcel, stuckReport } from '../domain/stuck-parcels.js';

export const OPEN_PARCELS = Symbol('OPEN_PARCELS');
export const STUCK_CLOCK = Symbol('STUCK_CLOCK');

/** The store's parcels in a non-final status whose last move is older than `before`. */
export interface OpenParcels {
  idleSince(query: {
    storeId: string;
    before: Date;
    carrier?: string | undefined;
  }): Promise<OpenParcel[]>;
}

/** No status allows less than one delivery day, so younger parcels are never read. */
const MIN_IDLE_MS = 86_400_000;

/** Parcels with no tracking news for too long, per status (#197). */
@Injectable()
export class StuckParcelsService {
  constructor(
    @Inject(OPEN_PARCELS) private readonly parcels: OpenParcels,
    @Inject(STUCK_CLOCK) private readonly now: () => Date,
  ) {}

  async list(storeId: string, query: StuckParcelsQuery): Promise<StuckParcelsResponse> {
    const now = this.now();
    const open = await this.parcels.idleSince({
      storeId,
      before: new Date(now.getTime() - MIN_IDLE_MS),
      carrier: query.carrier,
    });
    const report = stuckReport(open, now);
    return { ...report, items: report.items.slice(0, query.limit) };
  }
}
