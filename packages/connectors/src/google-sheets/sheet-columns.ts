import { ConnectorError } from '../connector.errors.js';
import { SHEETS_CODE } from './sheet-url.js';

export const SHEET_FIELDS = [
  'name',
  'phone',
  'wilaya',
  'commune',
  'address',
  'product',
  'quantity',
  'price',
  'shipping',
  'notes',
] as const;
export type SheetField = (typeof SHEET_FIELDS)[number];
export type SheetColumns = Partial<Record<SheetField, number>>;

/**
 * Header words sellers use in French, English and Arabic (landing-page builders write them this
 * way). Compared after lowercasing and removing accents, so "Téléphone" matches "telephone".
 */
const ALIASES: Record<SheetField, readonly string[]> = {
  name: ['nom', 'nom complet', 'name', 'full name', 'client', 'الاسم', 'الاسم الكامل'],
  phone: ['telephone', 'tel', 'phone', 'numero', 'mobile', 'الهاتف', 'رقم الهاتف'],
  wilaya: ['wilaya', 'province', 'state', 'الولاية'],
  commune: ['commune', 'city', 'ville', 'baladia', 'البلدية'],
  address: ['adresse', 'address', 'العنوان'],
  product: ['produit', 'product', 'article', 'المنتج'],
  quantity: ['quantite', 'qte', 'quantity', 'qty', 'الكمية'],
  price: ['prix', 'price', 'prix unitaire', 'السعر'],
  shipping: ['livraison', 'frais de livraison', 'shipping', 'التوصيل'],
  notes: ['note', 'notes', 'remarque', 'commentaire', 'ملاحظة'],
};

const REQUIRED: readonly SheetField[] = ['name', 'phone', 'wilaya', 'product'];

export const normalizeHeader = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Finds each field's column in the header row; throws when a required column is missing. */
export function columnsOf(header: readonly string[]): SheetColumns {
  const names = header.map(normalizeHeader);
  const columns: SheetColumns = {};
  for (const field of SHEET_FIELDS) {
    const index = names.findIndex((name) => ALIASES[field].includes(name));
    if (index >= 0) columns[field] = index;
  }
  const missing = REQUIRED.filter((field) => columns[field] === undefined);
  if (missing.length > 0) {
    const message = `The sheet needs columns for: ${missing.join(', ')}`;
    throw new ConnectorError('validation', message, { connector: SHEETS_CODE });
  }
  return columns;
}
