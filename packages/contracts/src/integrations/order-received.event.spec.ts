import { describe, expect, it } from 'vitest';
import { EVENT_TYPE_PATTERN } from '../events/envelope.schema.js';
import { INTEGRATION_EVENTS, OrderReceivedEventSchema } from './order-received.event.js';

const event = {
  connector: 'shopify',
  externalId: 'gid://shopify/Order/1001',
  externalName: '#1001',
  cancelled: false,
  order: {
    customer: {
      name: 'Client Test',
      phone: '0555 00 00 01',
      wilayaCode: 16,
      communeId: 1621,
      address: 'Rue des tests',
    },
    items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
    deliveryType: 'home',
    shippingFee: 600,
  },
};

describe('integrations order-received event', () => {
  it.each(Object.values(INTEGRATION_EVENTS))('names %s by the event convention', (type) => {
    expect(type).toMatch(EVENT_TYPE_PATTERN);
  });

  it('carries a matched order without its own source or external ref', () => {
    const parsed = OrderReceivedEventSchema.parse({
      ...event,
      order: { ...event.order, source: 'manual', externalRef: 'x' },
    });

    expect(parsed.order).not.toHaveProperty('source');
    expect(parsed.order).not.toHaveProperty('externalRef');
    expect(parsed.order?.customer.phone).toBe('+213555000001');
  });

  it('refuses an order without commune codes', () => {
    const customer = { ...event.order.customer, communeId: undefined };
    const broken = { ...event, order: { ...event.order, customer } };

    expect(OrderReceivedEventSchema.safeParse(broken).success).toBe(false);
  });

  it('accepts a cancellation without its order, but nothing else', () => {
    const cancellation = { ...event, cancelled: true, order: null };

    expect(OrderReceivedEventSchema.safeParse(cancellation).success).toBe(true);
    expect(OrderReceivedEventSchema.safeParse({ ...cancellation, cancelled: false }).success).toBe(
      false,
    );
  });
});
