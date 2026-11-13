import type { LiveSession } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../orders/order-draft';
import { liveDraft, liveParam, parseLiveParam } from './live-order';

const SESSION = '19900000-0000-4000-8000-000000000031';
const RESERVATION = '19900000-0000-4000-8000-000000000041';

const reservation: LiveSession['reservations'][number] = {
  id: RESERVATION,
  phone: '+213555123456',
  name: 'Amina',
  code: 'A1',
  size: 'L',
  quantity: 2,
  comment: 'A1 L x2 0555123456',
  createdAt: '2026-11-03T18:05:00.000Z',
  orderId: null,
};

const session: LiveSession = {
  id: SESSION,
  title: 'Live du soir',
  createdAt: '2026-11-03T18:00:00.000Z',
  products: [{ code: 'A1', name: 'Robe fleurie', unitPrice: 2900 }],
  reservations: [reservation],
};

describe('live order', () => {
  it('round-trips the reservation reference and refuses anything else', () => {
    const ref = { sessionId: SESSION, reservationId: RESERVATION };
    expect(parseLiveParam(liveParam(ref))).toEqual(ref);
    expect(parseLiveParam('abc.def')).toBeNull();
    expect(parseLiveParam(undefined)).toBeNull();
  });

  it('fills phone, name, the product with its size, and a note', () => {
    const draft = liveDraft(emptyDraft(), session, reservation);
    expect(draft).toMatchObject({ phone: '0555 12 34 56', name: 'Amina' });
    expect(draft.items).toMatchObject([{ name: 'Robe fleurie - L', quantity: 2, unitPrice: 2900 }]);
    expect(draft.notes).toBe('Live "Live du soir": A1 L x2 0555123456');
  });
});
