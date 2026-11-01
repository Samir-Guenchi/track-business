import { describe, expect, it } from 'vitest';
import { columnsOf } from './sheet-columns.js';
import { dinars, rowsToOrders } from './sheet-rows.js';

const HEADER = ['Nom complet', 'Téléphone', 'Wilaya', 'Commune', 'Produit', 'Quantité', 'Prix'];
const row = (name: string, product = 'Robe') => [
  name,
  '0555000001',
  '16 - Alger',
  'Bab Ezzouar',
  product,
  '2',
  '2 500 DA',
];

describe('order sheets', () => {
  it('finds columns by French, English or Arabic headers', () => {
    expect(columnsOf(HEADER)).toMatchObject({
      name: 0,
      phone: 1,
      wilaya: 2,
      commune: 3,
      product: 4,
    });
    expect(columnsOf(['الاسم', 'رقم الهاتف', 'الولاية', 'المنتج'])).toMatchObject({
      name: 0,
      phone: 1,
      wilaya: 2,
      product: 3,
    });
  });

  it('names the columns a sheet is missing', () => {
    expect(() => columnsOf(['Nom', 'Produit'])).toThrow('phone, wilaya');
  });

  it.each([
    ['2 500 DA', 2500],
    ['2500,00', 2500],
    ['2.500', 2500],
    ['gratuit', 0],
    [null, 0],
  ])('reads %s as %d dinars', (text, value) => {
    expect(dinars(text)).toBe(value);
  });

  it('turns rows into orders and skips blank ones', () => {
    const [order, ...rest] = rowsToOrders(
      [row('Client Test'), ['', '', '', '']],
      columnsOf(HEADER),
    );

    expect(rest).toEqual([]);
    expect(order).toMatchObject({
      currency: 'DZD',
      customer: {
        name: 'Client Test',
        phone: '0555000001',
        province: '16 - Alger',
        city: 'Bab Ezzouar',
      },
      items: [{ name: 'Robe', quantity: 2, unitPrice: 2500 }],
    });
  });

  it('keeps row ids when rows are inserted above, and tells identical rows apart', () => {
    const columns = columnsOf(HEADER);
    const before = rowsToOrders([row('A'), row('B'), row('B')], columns).map((o) => o.externalId);
    const after = rowsToOrders([row('New'), row('A'), row('B'), row('B')], columns).map(
      (o) => o.externalId,
    );

    expect(new Set(before).size).toBe(3);
    expect(after.slice(1)).toEqual(before);
  });
});
