/** A value found in a message and the exact text that carried it, so it can be cut out. */
export interface Found<T> {
  readonly value: T;
  readonly text: string;
}

const ARABIC_INDIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

/** "٠٥٥٥" and "۰۵۵۵" become "0555": customers type with Arabic keyboards. */
export function westernDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - PERSIAN_ZERO));
}

/** 05/06/07 + 8 digits, or +213 / 00213 without the 0; any spaces, dots or dashes between. */
const MOBILE = /(?:\+\s*213|00\s*213|(?<!\d)0)\s*[567](?:[\s./-]?\d){8}(?!\d)/g;

/** Every Algerian mobile in the message, normalised to E.164 and without duplicates. */
export function findPhones(text: string): Found<string>[] {
  const found = new Map<string, Found<string>>();
  for (const match of text.matchAll(MOBILE)) {
    const value = `+213${match[0].replace(/\D/g, '').slice(-9)}`;
    if (!found.has(value)) found.set(value, { value, text: match[0] });
  }
  return [...found.values()];
}

const NOT_IN_WORD = '(?<![\\p{L}\\p{N}])';
const QUANTITY_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `${NOT_IN_WORD}(?:x|×|qte|qté|quantité|quantite|كمية)\\s*:?\\s*(\\d{1,2})(?!\\d)`,
    'iu',
  ),
  new RegExp(`${NOT_IN_WORD}(\\d{1,2})\\s*(?:pcs|pièces?|pieces?|unités?|حبات|حبة|قطع)`, 'iu'),
];

/** "x2", "qté: 3", "2 pièces", "3 حبات". A bare number is never a quantity. */
export function findQuantity(text: string): Found<number> | null {
  for (const pattern of QUANTITY_PATTERNS) {
    const match = pattern.exec(text);
    const value = Number(match?.[1]);
    if (match && value >= 1) return { value, text: match[0] };
  }
  return null;
}

/** The value after a "label:" at the start of a line, e.g. "Adresse : cité 200 logts". */
export function findLabeled(text: string, labels: readonly string[]): Found<string> | null {
  const pattern = new RegExp(`^[ \\t]*(?:${labels.join('|')})[ \\t]*[:：-][ \\t]*(.+)$`, 'imu');
  const match = pattern.exec(text);
  const value = match?.[1]?.trim();
  return match && value ? { value, text: match[0] } : null;
}
