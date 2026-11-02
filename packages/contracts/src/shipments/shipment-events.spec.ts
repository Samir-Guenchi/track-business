import { describe, expect, it } from 'vitest';
import { EVENT_TYPE_PATTERN } from '../events/envelope.schema.js';
import { ShipOrdersRequestSchema } from './ship-orders.schema.js';
import { SHIPMENT_EVENTS, ShipRequestedEventSchema } from './shipment-events.js';

const ORDER = '11111111-1111-4111-8111-111111111111';

describe('shipment contract', () => {
  it.each(Object.values(SHIPMENT_EVENTS))('names %s by the event convention', (type) => {
    expect(type).toMatch(EVENT_TYPE_PATTERN);
  });

  it('accepts a ship request for up to 100 orders', () => {
    const request = { orderIds: [ORDER], carrier: 'yalidine', originWilayaCode: 16 };

    expect(ShipOrdersRequestSchema.parse(request)).toEqual(request);
    const tooMany = { ...request, orderIds: Array.from({ length: 101 }, () => ORDER) };
    expect(ShipOrdersRequestSchema.safeParse(tooMany).success).toBe(false);
  });

  it('requires a reference and recipient on the ship-requested event', () => {
    const event = {
      orderId: ORDER,
      reference: 'ORD-1001-v4',
      carrier: 'yalidine',
      originWilayaCode: 16,
      recipient: { name: 'Client', phone: '+213555000001', phone2: null, address: null },
      wilayaCode: 31,
      communeId: 1621,
      deliveryType: 'home',
      stopDeskId: null,
      codAmount: 3100,
      declaredValue: 2500,
      contents: '1 x Robe',
      notes: null,
    };

    expect(ShipRequestedEventSchema.parse(event)).toEqual(event);
    expect(ShipRequestedEventSchema.safeParse({ ...event, reference: '' }).success).toBe(false);
  });
});
