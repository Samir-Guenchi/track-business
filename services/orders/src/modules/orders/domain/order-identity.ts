import { createHash, randomInt } from 'node:crypto';
import type { OrderItemInput } from '@trackecom/contracts';

// Crockford base32 without I, L, O, U: easy to read over the phone.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Short reference such as `TE-4F7K2Q` (32^6 ≈ 1 billion per store). */
export function newOrderRef(): string {
  const chars = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]);
  return `TE-${chars.join('')}`;
}

/** Same products and quantities give the same hash, whatever the order or spelling case. */
export function itemsFingerprint(
  items: readonly Pick<OrderItemInput, 'productId' | 'name' | 'quantity'>[],
): string {
  const parts = items
    .map((item) => `${item.productId ?? item.name.trim().toLowerCase()}:${item.quantity}`)
    .sort();
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

export const DUPLICATE_WINDOW_MS = 48 * 60 * 60 * 1000;
