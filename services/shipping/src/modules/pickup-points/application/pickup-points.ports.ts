import type {
  PickupParcel,
  PickupParcelState,
  PickupPoint,
  PickupPointInputSchema,
  PickupStatement,
  PublicPickup,
} from '@trackecom/contracts';
import type { z } from 'zod';

export const PICKUP_POINTS_STORE = Symbol('PICKUP_POINTS_STORE');

export type PointFields = z.output<typeof PickupPointInputSchema>;

export interface PointScope {
  readonly storeId: string;
  readonly pointId: string;
}

/** What the drop needs to check about the point and the parcel. */
export interface DropCheck {
  readonly point: { readonly active: boolean; readonly capacity: number; readonly fee: number };
  readonly holding: number;
  /** The store's parcel with that tracking number, if any. */
  readonly shipment: { readonly id: string; readonly status: string } | null;
  readonly alreadyAtPoint: boolean;
}

export interface HeldParcel {
  readonly code: string;
  readonly failedAttempts: number;
  readonly releasedAt: Date | null;
}

export interface PickupPointsStore {
  createPoint(storeId: string, fields: PointFields): Promise<string>;
  updatePoint(scope: PointScope, fields: PointFields): Promise<boolean>;
  points(storeId: string, pointId?: string): Promise<PickupPoint[]>;
  dropCheck(scope: PointScope, trackingNumber: string): Promise<DropCheck | null>;
  drop(scope: PointScope, parcel: { shipmentId: string; code: string; fee: number }): Promise<void>;
  parcels(scope: PointScope, state?: PickupParcelState): Promise<PickupParcel[]>;
  held(scope: PointScope, shipmentId: string): Promise<HeldParcel | null>;
  failedAttempt(scope: PointScope, shipmentId: string): Promise<void>;
  release(scope: PointScope, release: { shipmentId: string; cashCollected: number }): Promise<void>;
  /** Marks released, not handed-over parcels as handed over; returns their count and cash. */
  handover(scope: PointScope): Promise<{ parcels: number; amount: number }>;
  statement(
    scope: PointScope,
    range: { from: Date; to: Date },
  ): Promise<Omit<PickupStatement, 'month'>>;
  publicPickup(publicCode: string): Promise<PublicPickup | null>;
}
