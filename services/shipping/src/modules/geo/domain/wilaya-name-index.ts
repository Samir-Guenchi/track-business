import type { Wilaya } from '@trackecom/contracts';
import { normalizePlaceName } from './normalize-place-name.js';
import { trigramSimilarity } from './similarity.js';

/** Spellings sellers and customers use that are neither the French nor the Arabic name. */
const WILAYA_ALIASES: Readonly<Record<number, readonly string[]>> = {
  6: ['Bgayet', 'Vgayet', 'Bougie'],
  15: ['Tizi'],
  16: ['Algiers', 'Dzair', 'Dzayer', 'Djazair'],
  19: ['Stif'],
  25: ['Qsentina', 'Ksentina'],
  31: ['Wahran'],
};

const FUZZY_MIN_SCORE = 0.85;
const FUZZY_MIN_LENGTH = 5;

export interface WilayaMatch {
  readonly code: number;
  readonly score: number;
}

/** Wilaya names (FR, AR, common aliases) for spotting a wilaya inside free text. */
export class WilayaNameIndex {
  private readonly byKey = new Map<string, number>();
  private readonly codes: ReadonlySet<number>;

  constructor(wilayas: readonly Wilaya[]) {
    this.codes = new Set(wilayas.map((wilaya) => wilaya.code));
    for (const wilaya of wilayas) {
      const names = [wilaya.nameFr, wilaya.nameAr, ...(WILAYA_ALIASES[wilaya.code] ?? [])];
      for (const name of names) this.byKey.set(normalizePlaceName(name), wilaya.code);
    }
  }

  has(code: number): boolean {
    return this.codes.has(code);
  }

  /** Exact name first; a near spelling ("Mostaganam") only for words long enough to be safe. */
  match(rawName: string): WilayaMatch | null {
    const key = normalizePlaceName(rawName);
    const exact = this.byKey.get(key);
    if (exact !== undefined) return { code: exact, score: 1 };
    if (key.length < FUZZY_MIN_LENGTH) return null;
    let best: WilayaMatch | null = null;
    for (const [name, code] of this.byKey) {
      const score = trigramSimilarity(key, name);
      if (score >= FUZZY_MIN_SCORE && score > (best?.score ?? 0)) best = { code, score };
    }
    return best;
  }
}
