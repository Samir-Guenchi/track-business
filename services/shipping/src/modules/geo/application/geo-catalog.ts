import { Inject, Injectable } from '@nestjs/common';
import type { Commune, Wilaya } from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';
import {
  type CommuneMatch,
  CommuneSearchIndex,
  type SearchOptions,
} from '../domain/commune-search-index.js';
import { GEO_REFERENCE_READER, type GeoReferenceReader } from './ports/geo-reference.reader.js';

export const GEO_CACHE_TTL_MS = 60 * 60 * 1000;
export const CLOCK = Symbol('CLOCK');
export type Clock = () => number;

export class WilayaNotFoundError extends DomainError {
  readonly code = 'geo.wilaya_not_found';
  readonly kind = 'not_found';
}

interface Snapshot {
  readonly loadedAt: number;
  readonly wilayas: readonly Wilaya[];
  readonly communesByWilaya: ReadonlyMap<number, readonly Commune[]>;
  readonly index: CommuneSearchIndex;
}

function groupByWilaya(communes: readonly Commune[]): Map<number, Commune[]> {
  const groups = new Map<number, Commune[]>();
  for (const commune of communes) {
    groups.set(commune.wilayaCode, [...(groups.get(commune.wilayaCode) ?? []), commune]);
  }
  return groups;
}

/**
 * Read side of the geo reference data. The whole dataset (~1,600 rows) is held in memory per
 * replica and refreshed after a TTL, so lookups and search never hit the database.
 */
@Injectable()
export class GeoCatalog {
  private snapshot: Promise<Snapshot> | undefined;

  constructor(
    @Inject(GEO_REFERENCE_READER) private readonly reader: GeoReferenceReader,
    @Inject(CLOCK) private readonly now: Clock,
  ) {}

  async listWilayas(): Promise<readonly Wilaya[]> {
    return (await this.current()).wilayas;
  }

  async listCommunes(wilayaCode: number): Promise<readonly Commune[]> {
    const snapshot = await this.current();
    if (!snapshot.wilayas.some((wilaya) => wilaya.code === wilayaCode)) {
      throw new WilayaNotFoundError(`Unknown wilaya ${wilayaCode}`);
    }
    return snapshot.communesByWilaya.get(wilayaCode) ?? [];
  }

  /** null when the code is not a current wilaya. */
  async wilaya(code: number): Promise<Wilaya | null> {
    return (await this.current()).wilayas.find((wilaya) => wilaya.code === code) ?? null;
  }

  /** null when the commune is not in that wilaya. */
  async commune(wilayaCode: number, communeId: number): Promise<Commune | null> {
    const communes = (await this.current()).communesByWilaya.get(wilayaCode) ?? [];
    return communes.find((commune) => commune.id === communeId) ?? null;
  }

  async search(query: string, options: SearchOptions): Promise<CommuneMatch[]> {
    return (await this.current()).index.search(query, options);
  }

  private async current(): Promise<Snapshot> {
    const cached = this.snapshot && (await this.snapshot.catch(() => undefined));
    if (cached && this.now() - cached.loadedAt < GEO_CACHE_TTL_MS) return cached;
    this.snapshot = this.load();
    return this.snapshot;
  }

  private async load(): Promise<Snapshot> {
    const [wilayas, searchable] = await Promise.all([
      this.reader.listWilayas(),
      this.reader.listCommunes(),
    ]);
    const communes: Commune[] = searchable.map(({ aliases: _aliases, ...commune }) => commune);
    return {
      loadedAt: this.now(),
      wilayas,
      communesByWilaya: groupByWilaya(communes),
      index: new CommuneSearchIndex(searchable),
    };
  }
}
