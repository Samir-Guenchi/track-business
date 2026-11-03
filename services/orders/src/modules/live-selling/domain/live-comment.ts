import {
  findPhones,
  findQuantity,
  westernDigits,
} from '../../smart-paste/domain/message-fields.js';

/** What one live comment reserves. */
export interface LiveCommentReading {
  readonly phone: string;
  readonly code: string;
  readonly size: string | null;
  readonly quantity: number;
  readonly name: string | null;
}

const NOT_IN_WORD = '(?<![\\p{L}\\p{N}])';
const NOT_AFTER = '(?![\\p{L}\\p{N}])';
const CODE = new RegExp(`${NOT_IN_WORD}([a-z])\\s?(\\d{1,2})(?!\\d)`, 'giu');
const LABELED_SIZE =
  /(?:taille|pointure|size|مقاس|قياس|القياس|المقاس)\s*:?\s*([\p{L}\p{N}]{1,4})/iu;
const LETTER_SIZE = new RegExp(`${NOT_IN_WORD}(XXXL|XXL|XL|XS|XXS|[23]XL|S|M|L)${NOT_AFTER}`, 'u');
/** "Amina B.: A1 L 0555..." as exported by live tools: the author before the colon. */
const AUTHOR = /^\s*([\p{L}][\p{L} .'-]{1,39}?)\s*:\s/u;

/** The first code in the comment that the session shows, e.g. "a 1" -> "A1". */
function findCode(text: string, codes: ReadonlySet<string>): string | null {
  for (const match of text.matchAll(CODE)) {
    const code = `${match[1]?.toUpperCase()}${Number(match[2])}`;
    if (codes.has(code)) return code;
  }
  return null;
}

function findSize(text: string): string | null {
  const labeled = LABELED_SIZE.exec(text)?.[1];
  if (labeled) return labeled.toUpperCase();
  return LETTER_SIZE.exec(text)?.[1] ?? null;
}

/**
 * Reads one comment: a known product code and an Algerian mobile are required; size, quantity
 * and the author's name are taken when present. Null when the comment reserves nothing.
 */
export function readLiveComment(
  comment: string,
  codes: ReadonlySet<string>,
): LiveCommentReading | null {
  const text = westernDigits(comment);
  const phone = findPhones(text)[0];
  if (!phone) return null;
  const rest = text.replace(phone.text, ' ');
  const code = findCode(rest, codes);
  if (!code) return null;
  return {
    phone: phone.value,
    code,
    size: findSize(rest.replace(AUTHOR, ' ')),
    quantity: findQuantity(rest)?.value ?? 1,
    name: AUTHOR.exec(text)?.[1]?.trim() ?? null,
  };
}

/** A comment that looks like a reservation (a phone or a shown code) but could not be read. */
export function looksLikeReservation(comment: string, codes: ReadonlySet<string>): boolean {
  const text = westernDigits(comment);
  return findPhones(text).length > 0 || findCode(text, codes) !== null;
}

/** One comment per non-empty line. */
export const splitComments = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
