import type { CarrierErrorKind, ShipmentRequest } from '@trackecom/carriers';
import type { ShipRequestedEvent, ShipmentFailure } from '@trackecom/contracts';

export interface PlaceNames {
  readonly originWilayaName: string;
  readonly wilayaName: string;
  readonly communeName: string;
  /** The carrier's id for the chosen stop-desk (#137); null for home delivery or no match. */
  readonly stopDeskCode: string | null;
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
    stopDeskCode: event.deliveryType === 'stopdesk' ? places.stopDeskCode : null,
    codAmount: event.codAmount,
    declaredValue: event.declaredValue,
    weightGrams: null,
    contents: event.contents,
    notes: event.notes,
    fragile: false,
    canOpen: false,
    collect: event.collect ?? null,
  };
}

/**
 * A carrier without an exchange service still gets the parcel: what to take back goes in the
 * courier's notes, and the seller follows the pickup by hand (#138).
 */
export function withExchangeFallback(
  request: ShipmentRequest,
  supported: boolean,
): ShipmentRequest {
  if (supported || request.collect === null) return request;
  const note = `ÉCHANGE - récupérer : ${request.collect}`;
  return { ...request, collect: null, notes: request.notes ? `${note}. ${request.notes}` : note };
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
