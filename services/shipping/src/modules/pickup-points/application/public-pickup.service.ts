import { Inject, Injectable } from '@nestjs/common';
import type { PublicPickup } from '@trackecom/contracts';
import { TrackingNotFoundError } from '../../tracking/domain/tracking.errors.js';
import { PICKUP_POINTS_STORE, type PickupPointsStore } from './pickup-points.ports.js';

/** Where the customer collects the parcel, and the code to give the shop (#202). */
@Injectable()
export class PublicPickupService {
  constructor(@Inject(PICKUP_POINTS_STORE) private readonly store: PickupPointsStore) {}

  async pickup(publicCode: string): Promise<PublicPickup> {
    const pickup = await this.store.publicPickup(publicCode);
    if (!pickup) throw new TrackingNotFoundError('No parcel for this tracking link');
    return pickup;
  }
}
