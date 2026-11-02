import type { ShipmentRequest } from '../shipment.types.js';
import type { YalidineParcelInput } from './yalidine.types.js';

/** "+213555123456" -> "0555123456", the local format Yalidine expects. */
export const localPhone = (e164: string) => e164.replace(/^\+213/, '0');

function splitName(fullName: string): { firstname: string; familyname: string } {
  const [first = fullName, ...rest] = fullName.trim().split(/\s+/);
  return { firstname: first, familyname: rest.join(' ') || first };
}

/** Our shipment request in Yalidine's create-parcel shape. */
export function toYalidineParcel(request: ShipmentRequest): YalidineParcelInput {
  const phones = [request.recipient.phone, request.recipient.phone2].filter(
    (phone): phone is string => Boolean(phone),
  );
  const stopDesk = request.deliveryType === 'stopdesk';
  return {
    order_id: request.reference,
    from_wilaya_name: request.origin.wilayaName,
    ...splitName(request.recipient.name),
    contact_phone: phones.map(localPhone).join(','),
    address: request.recipient.address ?? request.communeName,
    to_commune_name: request.communeName,
    to_wilaya_name: request.wilayaName,
    product_list: request.contents,
    price: request.codAmount,
    do_insurance: false,
    declared_value: request.declaredValue,
    height: 0,
    width: 0,
    length: 0,
    weight: Math.ceil((request.weightGrams ?? 0) / 1000),
    freeshipping: false,
    is_stopdesk: stopDesk,
    ...(stopDesk && request.stopDeskCode ? { stopdesk_id: request.stopDeskCode } : {}),
    has_exchange: false,
  };
}
