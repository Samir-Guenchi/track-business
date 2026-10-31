import type { ShipRequestedEvent } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { failureFor, toShipmentRequest } from './ship-request.js';

const event: ShipRequestedEvent = {
  orderId: '11111111-1111-4111-8111-111111111111',
  reference: 'ORD-1001-v4',
  carrier: 'yalidine',
  originWilayaCode: 16,
  recipient: { name: 'Client', phone: '+213555000001', phone2: null, address: 'Rue A' },
  wilayaCode: 31,
  communeId: 3101,
  deliveryType: 'home',
  stopDeskId: null,
  codAmount: 3100,
  declaredValue: 2500,
  contents: '1 x Robe',
  notes: null,
};

describe('toShipmentRequest', () => {
  it('fills the place names the carrier needs', () => {
    const request = toShipmentRequest(event, {
      originWilayaName: 'Alger',
      wilayaName: 'Oran',
      communeName: 'Oran',
    });

    expect(request).toMatchObject({
      reference: 'ORD-1001-v4',
      origin: { wilayaCode: 16, wilayaName: 'Alger' },
      wilayaName: 'Oran',
      codAmount: 3100,
    });
  });
});

describe('failureFor', () => {
  it.each([
    ['auth', 'not_connected'],
    ['validation', 'invalid_request'],
    ['unavailable', 'carrier_unavailable'],
    ['rate_limited', 'carrier_unavailable'],
  ] as const)('maps %s to %s', (kind, failure) => {
    expect(failureFor(kind)).toBe(failure);
  });
});
