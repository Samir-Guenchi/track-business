const ARABIC_DIACRITICS = /[ً-ٰٟـ]/g;
const LATIN_DIACRITICS = /[̀-ͯ]/g;
const ARABIC_SCRIPT = /[؀-ۿ]/;

/** Words that sellers add or drop freely: "Bab El Oued" = "Bab Oued", "الجزائر" = "جزائر". */
const FILLER_WORDS = new Set(['el', 'al', 'l', 'le', 'la', 'les', 'de', 'des', 'du', 'd', 'ال']);

/** Ordered: multi-letter French/Darija transliterations first. */
const LATIN_RULES: readonly [RegExp, string][] = [
  [/tch/g, 'ch'],
  [/dj/g, 'j'],
  [/ph/g, 'f'],
  [/q/g, 'k'],
  [/ou/g, 'u'],
  [/w/g, 'u'],
  [/y/g, 'i'],
  [/(.)\1+/g, '$1'],
  // Assimilated article: "Ezzouar" -> "zouar", "Es Senia" stays two words.
  [/^e(?=[zstdrnc])/g, ''],
];

const ARABIC_RULES: readonly [RegExp, string][] = [
  [/[أإآٱ]/g, 'ا'],
  [/ة/g, 'ه'],
  [/ى/g, 'ي'],
  [/^ال(?=..)/g, ''],
];

function normalizeWord(word: string): string {
  const rules = ARABIC_SCRIPT.test(word) ? ARABIC_RULES : LATIN_RULES;
  return rules.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    word,
  );
}

/** Canonical form used for matching: lowercase, no accents, unified transliteration, no fillers. */
export function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(LATIN_DIACRITICS, '')
    .replace(ARABIC_DIACRITICS, '')
    .split(/[^a-zء-ي]+/)
    .filter((word) => word.length > 0 && !FILLER_WORDS.has(word))
    .map(normalizeWord)
    .join(' ');
}

/** Consonant skeleton: absorbs vowel variants such as "Mostaganem" / "Mestghanem". */
export function consonantSkeleton(normalized: string): string {
  return normalized.replace(/[aeiou\s]/g, '').replace(/gh/g, 'g');
}
