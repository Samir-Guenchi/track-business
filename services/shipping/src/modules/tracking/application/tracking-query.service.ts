import { Inject, Injectable } from '@nestjs/common';
import type { Eta } from '@trackecom/contracts';
import { EtaEstimator } from '../../eta/application/eta-estimator.js';
import { TrackingNotFoundError } from '../domain/tracking.errors.js';
import {
  type ShipmentTimeline,
  TRACKING_REPOSITORY,
  type TrackingRepository,
} from './ports/tracking.repository.js';
import { type Clock, TRACKING_CLOCK } from './tracking-ingest.service.js';

export interface TimelineWithEta extends ShipmentTimeline {
  readonly eta: Eta | null;
}

/** Reads the timeline for the seller (by order, store-scoped) and the customer (by public code). */
@Injectable()
export class TrackingQueryService {
  constructor(
    @Inject(TRACKING_REPOSITORY) private readonly repository: TrackingRepository,
    private readonly eta: EtaEstimator,
    @Inject(TRACKING_CLOCK) private readonly now: Clock,
  ) {}

  async forOrder(storeId: string, orderId: string): Promise<TimelineWithEta[]> {
    const timelines = await this.repository.forOrder(storeId, orderId);
    return Promise.all(timelines.map((timeline) => this.withEta(timeline)));
  }

  async byPublicCode(publicCode: string): Promise<TimelineWithEta> {
    const timeline = await this.repository.byPublicCode(publicCode);
    if (!timeline) throw new TrackingNotFoundError('No parcel for this tracking link');
    return this.withEta(timeline);
  }

  private async withEta(timeline: ShipmentTimeline): Promise<TimelineWithEta> {
    return { ...timeline, eta: await this.eta.forTimeline(timeline, this.now()) };
  }
}
