import { Inject, Injectable } from '@nestjs/common';
import type {
  HandoverResponse,
  ListPickupParcelsResponse,
  PickupParcelState,
  PickupStatement,
  ReleaseParcel,
} from '@trackecom/contracts';
import {
  codeMatches,
  isDroppable,
  MAX_CODE_ATTEMPTS,
  monthRange,
  newPickupCode,
} from '../domain/pickup-code.js';
import {
  PickupAlreadyReleasedError,
  PickupDropRefusedError,
  PickupLockedError,
  PickupParcelNotFoundError,
  PickupPointNotFoundError,
  WrongPickupCodeError,
} from '../domain/pickup.errors.js';
import {
  PICKUP_POINTS_STORE,
  type PickupPointsStore,
  type PointScope,
} from './pickup-points.ports.js';

/** Parcels at a partner shop (#202): in with the courier, out only with the customer's code. */
@Injectable()
export class PickupParcelsService {
  constructor(@Inject(PICKUP_POINTS_STORE) private readonly store: PickupPointsStore) {}

  async drop(scope: PointScope, shipmentId: string): Promise<ListPickupParcelsResponse> {
    const check = await this.store.dropCheck(scope, shipmentId);
    if (!check) throw new PickupPointNotFoundError('No such pickup point');
    if (check.shipmentStatus === null) throw new PickupParcelNotFoundError('No such parcel');
    const refused =
      !check.point.active ||
      check.holding >= check.point.capacity ||
      check.alreadyAtPoint ||
      !isDroppable(check.shipmentStatus);
    if (refused) throw new PickupDropRefusedError('This parcel cannot be left at this point');
    await this.store.drop(scope, { shipmentId, code: newPickupCode(), fee: check.point.fee });
    return this.parcels(scope, 'held');
  }

  async parcels(scope: PointScope, state?: PickupParcelState): Promise<ListPickupParcelsResponse> {
    return { items: await this.store.parcels(scope, state) };
  }

  async release(
    scope: PointScope,
    shipmentId: string,
    body: ReleaseParcel,
  ): Promise<ListPickupParcelsResponse> {
    const held = await this.store.held(scope, shipmentId);
    if (!held) throw new PickupParcelNotFoundError('No such parcel at this point');
    if (held.releasedAt) throw new PickupAlreadyReleasedError('Already handed to the customer');
    if (held.failedAttempts >= MAX_CODE_ATTEMPTS) {
      throw new PickupLockedError('Too many wrong codes; ask the seller');
    }
    if (!codeMatches(held.code, body.code)) {
      await this.store.failedAttempt(scope, shipmentId);
      throw new WrongPickupCodeError('Wrong pickup code');
    }
    await this.store.release(scope, { shipmentId, cashCollected: body.cashCollected });
    return this.parcels(scope);
  }

  handover(scope: PointScope): Promise<HandoverResponse> {
    return this.store.handover(scope);
  }

  async statement(scope: PointScope, month: string): Promise<PickupStatement> {
    return { month, ...(await this.store.statement(scope, monthRange(month))) };
  }
}
