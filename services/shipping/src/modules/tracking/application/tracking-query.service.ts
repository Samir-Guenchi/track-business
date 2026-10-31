import { Inject, Injectable } from '@nestjs/common';
import { TrackingNotFoundError } from '../domain/tracking.errors.js';
import {
  type ShipmentTimeline,
  TRACKING_REPOSITORY,
  type TrackingRepository,
} from './ports/tracking.repository.js';

/** Reads the timeline for the seller (by order, store-scoped) and the customer (by public code). */
@Injectable()
export class TrackingQueryService {
  constructor(@Inject(TRACKING_REPOSITORY) private readonly repository: TrackingRepository) {}

  forOrder(storeId: string, orderId: string): Promise<ShipmentTimeline[]> {
    return this.repository.forOrder(storeId, orderId);
  }

  async byPublicCode(publicCode: string): Promise<ShipmentTimeline> {
    const timeline = await this.repository.byPublicCode(publicCode);
    if (!timeline) throw new TrackingNotFoundError('No parcel for this tracking link');
    return timeline;
  }
}
