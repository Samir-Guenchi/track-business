import { UpdateStorePricesRequestSchema, type StorePricesResponse } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { draftOf, fillEmpty, priceChanges } from './price-grid';

const saved: StorePricesResponse = {
  items: [
    { wilayaCode: 16, deliveryType: 'home', price: 600 },
    { wilayaCode: 16, deliveryType: 'stopdesk', price: 400 },
    { wilayaCode: 11, deliveryType: 'home', price: null },
    { wilayaCode: 11, deliveryType: 'stopdesk', price: 1200 },
  ],
  freeShippingFrom: 8000,
  freeShippingExcludedWilayas: [11],
};

describe('price grid', () => {
  it('shows one row per wilaya in code order with empty cells for no delivery', () => {
    expect(draftOf(saved).rows).toEqual([
      { wilayaCode: 11, home: '', stopdesk: '1200', excluded: true },
      { wilayaCode: 16, home: '600', stopdesk: '400', excluded: false },
    ]);
  });

  it('sends nothing when nothing changed', () => {
    expect(priceChanges(draftOf(saved), draftOf(saved))).toBeNull();
  });

  it('sends only the changed cells and rules, in a shape the API accepts', () => {
    const before = draftOf(saved);
    const after = {
      freeShippingFrom: '',
      rows: before.rows.map((row) =>
        row.wilayaCode === 16 ? { ...row, home: '650', excluded: true } : row,
      ),
    };
    const change = priceChanges(after, before);

    expect(change).toEqual({
      items: [{ wilayaCode: 16, deliveryType: 'home', price: 650 }],
      freeShippingFrom: null,
      freeShippingExcludedWilayas: [11, 16],
    });
    expect(UpdateStorePricesRequestSchema.safeParse(change).success).toBe(true);
  });

  it('fills only the empty cells of one delivery type', () => {
    const rows = fillEmpty(draftOf(saved), 'home', 900).rows;

    expect(rows.map((row) => row.home)).toEqual(['900', '600']);
  });
});
