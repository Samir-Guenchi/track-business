import { type Found, findLabeled } from './message-fields.js';

const NAME_LABELS = ['nom et pr[ée]nom', 'nom', 'pr[ée]nom', 'name', 'الاسم', 'الإسم', 'اسم'];
const GREETINGS = new Set([
  'salam',
  'slm',
  'bonjour',
  'bjr',
  'bonsoir',
  'bsr',
  'salut',
  'hello',
  'svp',
  'je',
  'السلام',
  'سلام',
  'مرحبا',
  'اريد',
  'أريد',
  'نحب',
]);
const MAX_NAME_WORDS = 4;

const letterWords = (text: string) => text.match(/[\p{L}\p{M}'’-]+/gu) ?? [];

/**
 * "Nom: Karim B." wins. Otherwise the first line up to its first digit, once the place words
 * are cut out, if it looks like a name: 1 to 4 words and no greeting ("Salam je veux...").
 */
export function findCustomerName(
  text: string,
  placeTexts: readonly string[],
): Found<string> | null {
  const labeled = findLabeled(text, NAME_LABELS);
  if (labeled) return labeled;
  const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
  const beforeDigits = firstLine.split(/\d/)[0] ?? '';
  const withoutPlaces = placeTexts.reduce((line, place) => line.replace(place, ' '), beforeDigits);
  const words = letterWords(withoutPlaces);
  const first = words[0]?.toLowerCase();
  if (!first || GREETINGS.has(first) || words.length > MAX_NAME_WORDS) return null;
  if (words.some((word) => word.length < 2)) return null;
  const value = words.join(' ');
  return { value, text: value };
}
