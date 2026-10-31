import type { ShipRequestedEvent } from '@trackecom/contracts';
import type { OrderLine, OrderRecord } from '../../orders/domain/order.js';

const CONTENTS_MAX = 200;

/** Label text such as "2 x Robe, 1 x Sac", cut to what carriers accept. */
export function parcelContents(items: readonly OrderLine[]): string {
  const text = items.map((item) => `${item.quantity} x ${item.name}`).join(', ');
  return text.length <= CONTENTS_MAX ? text : `${text.slice(0, CONTENTS_MAX - 1)}…`;
}

/** One reference per request: a new request after a failure gets a new parcel at the carrier. */
export const shipReference = (order: OrderRecord): string => `${order.ref}-v${order.version}`;

/** Everything shipping needs for the label; shipping never reads the orders database. */
export function toShipRequested(
  order: OrderRecord,
  choice: { carrier: string; originWilayaCode: number },
): ShipRequestedEvent {
  const { customer } = order;
  return {
    orderId: order.id,
    reference: shipReference(order),
    carrier: choice.carrier,
    originWilayaCode: choice.originWilayaCode,
    recipient: {
      name: customer.name,
      phone: customer.phone,
      phone2: customer.phone2,
      address: customer.address,
    },
    wilayaCode: customer.wilayaCode,
    communeId: customer.communeId,
    deliveryType: order.deliveryType,
    stopDeskId: order.stopDeskId,
    codAmount: order.codAmount,
    declaredValue: order.subtotal,
    contents: parcelContents(order.items),
    notes: order.notes,
  };
}
