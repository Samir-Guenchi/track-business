import { createHash } from 'node:crypto';
import type { ExternalOrder } from '../connector.types.js';
import type { SheetColumns, SheetField } from './sheet-columns.js';

/** Sheets have no edit dates: every row gets this one, so a row already seen is skipped. */
export const SHEET_EPOCH = new Date(0);

const cell = (row: readonly string[], columns: SheetColumns, field: SheetField) => {
  const index = columns[field];
  const value = index === undefined ? '' : (row[index] ?? '').trim();
  return value === '' ? null : value;
};

/** "2 500 DA", "2500,00" and "2.500" all read as 2500 dinars; anything else is 0. */
export function dinars(text: string | null): number {
  if (!text) return 0;
  const digits = text
    .replace(/[^\d.,]/g, '')
    .replace(/[.,]\d{1,2}$/, '')
    .replace(/[.,]/g, '');
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : 0;
}

/**
 * The row's identity: its customer and product, plus how many identical rows came before it.
 * Inserting or sorting rows keeps ids stable; editing the customer or product of a row that was
 * already imported makes a new order, which orders then flags as a possible duplicate.
 */
function rowId(parts: readonly (string | null)[], seen: Map<string, number>): string {
  const key = parts.map((part) => (part ?? '').toLowerCase()).join('|');
  const occurrence = (seen.get(key) ?? 0) + 1;
  seen.set(key, occurrence);
  return createHash('sha256').update(`${key}#${occurrence}`).digest('hex').slice(0, 32);
}

function orderOf(row: readonly string[], columns: SheetColumns, id: string): ExternalOrder {
  const get = (field: SheetField) => cell(row, columns, field);
  const product = get('product') ?? '';
  return {
    externalId: id,
    name: `${get('name') ?? ''} · ${product}`.slice(0, 60),
    createdAt: SHEET_EPOCH,
    updatedAt: SHEET_EPOCH,
    currency: 'DZD',
    customer: {
      name: get('name') ?? '',
      phone: get('phone'),
      address: get('address'),
      city: get('commune'),
      province: get('wilaya'),
      zip: null,
    },
    items: [
      {
        name: product,
        sku: null,
        quantity: Math.max(1, dinars(get('quantity'))),
        unitPrice: dinars(get('price')),
      },
    ],
    shippingFee: dinars(get('shipping')),
    discount: 0,
    note: get('notes'),
    cancelled: false,
  };
}

/** Every row with a customer name and a product becomes an order; blank rows are skipped. */
export function rowsToOrders(
  rows: readonly (readonly string[])[],
  columns: SheetColumns,
): ExternalOrder[] {
  const seen = new Map<string, number>();
  return rows
    .filter((row) => cell(row, columns, 'name') && cell(row, columns, 'product'))
    .map((row) => {
      const parts = (['name', 'phone', 'product', 'quantity'] as const).map((field) =>
        cell(row, columns, field),
      );
      return orderOf(row, columns, rowId(parts, seen));
    });
}
