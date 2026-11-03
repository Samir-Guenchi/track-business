import { describe, expect, it } from 'vitest';
import type { OrderRecord } from '../../orders/domain/order.js';
import { algiersYear, invoiceNumber, totalsOf } from './invoice-draft.js';

const order = { subtotal: 5000, shippingFee: 600, discount: 200 } as OrderRecord;

describe('totalsOf', () => {
  it('shows no VAT under the IFU regime', () => {
    expect(totalsOf(order, 'ifu')).toEqual({
      shippingFee: 600,
      discount: 200,
      total: 5400,
      vatRate: 0,
      vatAmount: 0,
      totalBeforeTax: 5400,
    });
  });

  it('takes 19% VAT out of the tax-included total under the real regime', () => {
    const totals = totalsOf(order, 'real');
    expect(totals).toMatchObject({ total: 5400, vatRate: 19, totalBeforeTax: 4538 });
    expect(totals.totalBeforeTax + totals.vatAmount).toBe(totals.total);
  });
});

describe('invoice numbers', () => {
  it('pads the sequence and prefixes credit notes', () => {
    expect(invoiceNumber('invoice', 2026, 42)).toBe('F-2026-000042');
    expect(invoiceNumber('credit_note', 2026, 1)).toBe('AV-2026-000001');
  });

  it('counts the year in Algerian time', () => {
    expect(algiersYear(new Date('2026-12-31T23:30:00Z'))).toBe(2027);
  });
});
