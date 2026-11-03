import type { LiveReservation, LiveSession } from '@trackecom/contracts';
import { newItem, type OrderDraft } from '../orders/order-draft';
import { localPhone } from '../orders/pasted-order';

/** Which reservation the new-order form is filled from: `?live=<sessionId>.<reservationId>`. */
export interface LiveRef {
  readonly sessionId: string;
  readonly reservationId: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const liveParam = (ref: LiveRef) => `${ref.sessionId}.${ref.reservationId}`;

export function parseLiveParam(value: string | undefined): LiveRef | null {
  const [sessionId, reservationId, ...rest] = (value ?? '').split('.');
  if (rest.length > 0 || !UUID.test(sessionId ?? '') || !UUID.test(reservationId ?? '')) {
    return null;
  }
  return { sessionId: sessionId ?? '', reservationId: reservationId ?? '' };
}

/**
 * The order form filled from a live reservation (#199): phone, name and the reserved product
 * with its size; the live and the comment go to the notes. The agent adds the address.
 */
export function liveDraft(draft: OrderDraft, session: LiveSession, reservation: LiveReservation) {
  const product = session.products.find((entry) => entry.code === reservation.code);
  const name = product ? product.name : reservation.code;
  const item = {
    ...newItem(),
    name: reservation.size ? `${name} - ${reservation.size}` : name,
    quantity: reservation.quantity,
    unitPrice: product?.unitPrice ?? 0,
  };
  const note = `Live "${session.title}": ${reservation.comment}`;
  return {
    ...draft,
    phone: localPhone(reservation.phone),
    name: reservation.name ?? draft.name,
    items: [item],
    notes: draft.notes ? `${draft.notes}\n${note}` : note,
  } satisfies OrderDraft;
}
