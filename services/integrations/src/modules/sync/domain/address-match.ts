/** A place in the geo reference data, with the names a shop may use for it. */
export interface Place {
  readonly id: number;
  readonly nameFr: string;
  readonly nameAr: string;
}

/** Lowercase, no accents, no punctuation: "Béjaïa" and "BEJAIA " compare equal. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

const namesOf = (place: Place) => [normalize(place.nameFr), normalize(place.nameAr)];

/** Exact name first, then a single place whose name the text contains (or the reverse). */
function byName<T extends Place>(text: string, places: readonly T[]): T | null {
  const wanted = normalize(text);
  if (!wanted) return null;
  const exact = places.find((place) => namesOf(place).includes(wanted));
  if (exact) return exact;
  const partial = places.filter((place) =>
    namesOf(place).some(
      (name) => name.length > 2 && (wanted.includes(name) || name.includes(wanted)),
    ),
  );
  return partial.length === 1 ? (partial[0] ?? null) : null;
}

/**
 * The wilaya a shop's province text names: "16", "16 - Alger", "DZ-16", "Alger" or "الجزائر".
 * A number wins over a name; an ambiguous or unknown text gives null, never a guess.
 */
export function matchWilaya(province: string | null, wilayas: readonly Place[]): number | null {
  if (!province) return null;
  const code = /(?:^|\D)(\d{1,2})(?:\D|$)/.exec(province)?.[1];
  if (code && wilayas.some((wilaya) => wilaya.id === Number(code))) return Number(code);
  return byName(province, wilayas)?.id ?? null;
}

/** The commune a shop's city text names inside one wilaya, or null when unsure. */
export function matchCommune(city: string | null, communes: readonly Place[]): number | null {
  if (!city) return null;
  return byName(city, communes)?.id ?? null;
}
