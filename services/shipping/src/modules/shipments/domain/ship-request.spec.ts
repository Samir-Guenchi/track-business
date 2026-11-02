import type { ShipRequestedEvent } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { failureFor, toShipmentRequest, withExchangeFallback } from './ship-request.js';

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

const places = { originWilayaName: 'Alger', wilayaName: 'Oran', communeName: 'Oran' };

describe('toShipmentRequest', () => {
  it('fills the place names the carrier needs', () => {
    const request = toShipmentRequest(event, { ...places, stopDeskCode: 'ignored-for-home' });

    expect(request).toMatchObject({
      reference: 'ORD-1001-v4',
      origin: { wilayaCode: 16, wilayaName: 'Alger' },
      wilayaName: 'Oran',
      codAmount: 3100,
      stopDeskCode: null,
    });
  });

  it("sends the carrier's desk code for a stop-desk parcel (#137)", () => {
    const desk = { ...event, deliveryType: 'stopdesk' as const, stopDeskId: 'some-desk' };
    const request = toShipmentRequest(desk, { ...places, stopDeskCode: '31-ES-SENIA' });
    expect(request.stopDeskCode).toBe('31-ES-SENIA');
  });
});

describe('withExchangeFallback', () => {
  const exchange = toShipmentRequest(
    { ...event, collect: '1 x Robe - M' },
    { ...places, stopDeskCode: null },
  );

  it('keeps the exchange for a carrier that offers it', () => {
    expect(withExchangeFallback(exchange, true).collect).toBe('1 x Robe - M');
  });

  it("writes what to take back in the courier's notes otherwise", () => {
    const sent = withExchangeFallback(exchange, false);
    expect(sent.collect).toBeNull();
    expect(sent.notes).toBe('ÉCHANGE - récupérer : 1 x Robe - M');
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
