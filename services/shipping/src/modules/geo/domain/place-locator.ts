import type { Commune, LocatePlacesResponse } from '@trackecom/contracts';
import type { CommuneSearchIndex } from './commune-search-index.js';
import { normalizePlaceName } from './normalize-place-name.js';
import { type Ngram, messageNgrams } from './text-ngrams.js';
import type { WilayaNameIndex } from './wilaya-name-index.js';

const MAX_WORDS = 4;
const FUZZY_MAX_WORDS = 2;
const FUZZY_MIN_LENGTH = 5;
/** Above the 0.85 a consonant skeleton alone gives: "taille" must not read as Taouiala. */
const FUZZY_MIN_SCORE = 0.87;
/** Fuzzy search costs a scan of every commune; a long message is cut to its first ngrams. */
const FUZZY_MAX_NGRAMS = 60;
/** "wilaya 16", "W.16", "ولاية 31": a number only counts as a wilaya next to such a word. */
const WILAYA_NUMBER = /(?:wilaya|wilayat|ولاية|\bw)\s*(?:n°|no|num|[.:#-])?\s*(\d{1,2})(?!\d)/iu;

export interface PlaceIndexes {
  readonly wilayas: WilayaNameIndex;
  readonly communes: CommuneSearchIndex;
}

type WilayaMention = NonNullable<LocatePlacesResponse['wilaya']>;
type CommuneMention = NonNullable<LocatePlacesResponse['commune']>;

function wilayaByNumber(text: string, wilayas: WilayaNameIndex): WilayaMention | null {
  const match = WILAYA_NUMBER.exec(text);
  const code = Number(match?.[1]);
  return match && wilayas.has(code) ? { code, matchedText: match[0], score: 1 } : null;
}

/** "El Oued" inside "Bab El Oued" is part of a commune name, not the wilaya of El Oued. */
function insideCommuneName(ngram: Ngram, ngrams: readonly Ngram[], indexes: PlaceIndexes) {
  return ngrams.some(
    (longer) =>
      longer.words > ngram.words &&
      longer.text.includes(ngram.text) &&
      indexes.communes.exact(longer.text).length > 0,
  );
}

function wilayaByName(ngrams: readonly Ngram[], indexes: PlaceIndexes): WilayaMention | null {
  for (const ngram of ngrams) {
    const match = indexes.wilayas.match(ngram.text);
    if (match && !insideCommuneName(ngram, ngrams, indexes)) {
      return { ...match, matchedText: ngram.text };
    }
  }
  return null;
}

/** One commune for this text, or null when it names several in different wilayas. */
function single(candidates: readonly Commune[], wilayaCode?: number): Commune | null {
  const inWilaya = candidates.filter(
    (commune) => wilayaCode === undefined || commune.wilayaCode === wilayaCode,
  );
  return inWilaya.length === 1 ? (inWilaya[0] ?? null) : null;
}

function communeExact(ngrams: readonly Ngram[], indexes: PlaceIndexes, wilayaCode?: number) {
  for (const ngram of ngrams) {
    const commune = single(indexes.communes.exact(ngram.text), wilayaCode);
    if (commune) return { commune, matchedText: ngram.text, score: 1 };
  }
  return null;
}

function communeFuzzy(ngrams: readonly Ngram[], indexes: PlaceIndexes, wilayaCode?: number) {
  const options = wilayaCode === undefined ? { limit: 1 } : { limit: 1, wilayaCode };
  const candidates = ngrams
    .filter(
      (n) => n.words <= FUZZY_MAX_WORDS && normalizePlaceName(n.text).length >= FUZZY_MIN_LENGTH,
    )
    .slice(0, FUZZY_MAX_NGRAMS);
  let best: CommuneMention | null = null;
  for (const ngram of candidates) {
    const [top] = indexes.communes.search(ngram.text, options);
    if (top && top.score >= FUZZY_MIN_SCORE && top.score > (best?.score ?? 0)) {
      best = { commune: top.commune, matchedText: ngram.text, score: top.score };
    }
  }
  return best;
}

function findCommune(ngrams: readonly Ngram[], indexes: PlaceIndexes, wilayaCode?: number) {
  return communeExact(ngrams, indexes, wilayaCode) ?? communeFuzzy(ngrams, indexes, wilayaCode);
}

/**
 * The wilaya and commune a pasted message names ("Bab Ezzouar Alger", "ولاية 31 السانية").
 * A wilaya named in the text narrows the commune search; a commune alone implies its wilaya.
 * Ambiguous or unknown text gives null rather than a guess the agent might not notice.
 */
export function locatePlaces(text: string, indexes: PlaceIndexes): LocatePlacesResponse {
  const ngrams = messageNgrams(text, MAX_WORDS);
  const wilaya = wilayaByNumber(text, indexes.wilayas) ?? wilayaByName(ngrams, indexes);
  const commune =
    findCommune(ngrams, indexes, wilaya?.code) ?? (wilaya ? null : findCommune(ngrams, indexes));
  if (wilaya || !commune) return { wilaya, commune };
  return {
    wilaya: { code: commune.commune.wilayaCode, matchedText: null, score: commune.score },
    commune,
  };
}
