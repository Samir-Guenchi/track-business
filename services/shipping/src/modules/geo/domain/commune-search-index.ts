import type { Commune } from '@trackecom/contracts';
import { consonantSkeleton, normalizePlaceName } from './normalize-place-name.js';
import { trigramSimilarity } from './similarity.js';

export interface SearchableCommune extends Commune {
  readonly aliases: readonly string[];
}

interface IndexedCommune {
  readonly commune: Commune;
  readonly keys: readonly string[];
}

export interface CommuneMatch {
  readonly commune: Commune;
  readonly score: number;
}

export interface SearchOptions {
  readonly limit: number;
  readonly wilayaCode?: number;
}

const MIN_SCORE = 0.3;
const PREFIX_SCORE = 0.9;
const SKELETON_WEIGHT = 0.85;

function scoreKey(query: string, key: string): number {
  if (key === query) return 1;
  if (key.startsWith(query)) return PREFIX_SCORE;
  const direct = trigramSimilarity(query, key);
  const skeleton = trigramSimilarity(consonantSkeleton(query), consonantSkeleton(key));
  return Math.max(direct, SKELETON_WEIGHT * skeleton);
}

function toIndexed({ aliases, ...commune }: SearchableCommune): IndexedCommune {
  const names = [commune.nameFr, commune.nameAr, ...aliases];
  return { commune, keys: [...new Set(names.map(normalizePlaceName))].filter(Boolean) };
}

/**
 * In-memory fuzzy search over ~1,500 communes in Arabic, French and Latin-script Darija.
 * Pure and synchronous: built once from the reference data and rebuilt when it changes.
 */
export class CommuneSearchIndex {
  private readonly entries: readonly IndexedCommune[];

  constructor(communes: readonly SearchableCommune[]) {
    this.entries = communes.map(toIndexed);
  }

  search(rawQuery: string, options: SearchOptions): CommuneMatch[] {
    const query = normalizePlaceName(rawQuery);
    if (query.length === 0) return [];
    return this.entries
      .filter(
        (entry) =>
          options.wilayaCode === undefined || entry.commune.wilayaCode === options.wilayaCode,
      )
      .map((entry) => ({ commune: entry.commune, score: this.bestScore(query, entry.keys) }))
      .filter((match) => match.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score || a.commune.nameFr.localeCompare(b.commune.nameFr))
      .slice(0, options.limit);
  }

  private bestScore(query: string, keys: readonly string[]): number {
    const best = Math.max(...keys.map((key) => scoreKey(query, key)));
    return Math.round(best * 1000) / 1000;
  }
}
