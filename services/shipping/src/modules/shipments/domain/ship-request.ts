import type { CarrierErrorKind, ShipmentRequest } from '@trackecom/carriers';
import type { ShipRequestedEvent, ShipmentFailure } from '@trackecom/contracts';

export interface PlaceNames {
  readonly originWilayaName: string;
  readonly wilayaName: string;
  readonly communeName: string;
}

/** The carrier-neutral parcel for one ship request. */
export function toShipmentRequest(event: ShipRequestedEvent, places: PlaceNames): ShipmentRequest {
  return {
    reference: event.reference,
    recipient: event.recipient,
    origin: { wilayaCode: event.originWilayaCode, wilayaName: places.originWilayaName },
    wilayaCode: event.wilayaCode,
    wilayaName: places.wilayaName,
    communeId: event.communeId,
    communeName: places.communeName,
    deliveryType: event.deliveryType,
    // Our stop desks are not mapped to carrier codes yet; stop-desk parcels fail with a reason.
    stopDeskCode: null,
    codAmount: event.codAmount,
    declaredValue: event.declaredValue,
    weightGrams: null,
    contents: event.contents,
    notes: event.notes,
    fragile: false,
    canOpen: false,
  };
}

const FAILURE_BY_KIND: Readonly<Record<CarrierErrorKind, ShipmentFailure>> = {
  auth: 'not_connected',
  validation: 'invalid_request',
  not_found: 'invalid_request',
  rate_limited: 'carrier_unavailable',
  unavailable: 'carrier_unavailable',
  not_supported: 'not_supported',
};

/** What the seller is told when the carrier refused or could not be reached. */
export const failureFor = (kind: CarrierErrorKind): ShipmentFailure => FAILURE_BY_KIND[kind];
