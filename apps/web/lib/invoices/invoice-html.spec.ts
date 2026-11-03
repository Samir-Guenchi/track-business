import { describe, expect, it } from 'vitest';
import { type InvoiceText, invoiceHtml, presentLines } from './invoice-html';

const text: InvoiceText = {
  title: 'Facture F-2026-000001',
  dir: 'ltr',
  seller: ['SARL <Test>'],
  customer: ['Client'],
  meta: ['Date : 3 nov. 2026'],
  headers: ['Article', 'Qté', 'Prix', 'Total'],
  lines: [['Sac "cuir"', '2', '2 500 DA', '5 000 DA']],
  totals: [['Total TTC', '5 600 DA']],
  footer: 'Payé à la livraison.',
};

describe('invoiceHtml', () => {
  it('escapes every value', () => {
    const html = invoiceHtml(text);
    expect(html).toContain('SARL &lt;Test&gt;');
    expect(html).toContain('Sac &quot;cuir&quot;');
    expect(html).not.toContain('<Test>');
  });

  it('sets the page direction', () => {
    expect(invoiceHtml({ ...text, dir: 'rtl' })).toContain('<html dir="rtl">');
  });
});

describe('presentLines', () => {
  it('drops empty values', () => {
    expect(
      presentLines([
        ['NIF:', '000'],
        ['NIS:', null],
        ['RC:', ''],
      ]),
    ).toEqual(['NIF: \u2068000\u2069']);
  });
});
