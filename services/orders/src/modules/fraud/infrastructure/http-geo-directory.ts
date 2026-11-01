import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { GeoDirectory } from '../application/ports/fraud.ports.js';

/** Reference data changes only with a territorial reform, so a few hours of cache is safe. */
const CACHE_MS = 6 * 60 * 60_000;
const TIMEOUT_MS = 2_000;
/** Only the ids are needed; a field shipping adds later must not break the check. */
const CommuneIdsSchema = z.object({ items: z.array(z.object({ id: z.number().int() })) });

interface Cached {
  readonly communeIds: ReadonlySet<number>;
  readonly until: number;
}

/**
 * Reads a wilaya's communes from shipping's public geo API and keeps them in memory. It is a
 * cache of public data, not state, so every replica may hold its own copy. When shipping cannot
 * be reached the check is skipped (null): a missing flag is better than a blocked order.
 */
@Injectable()
export class HttpGeoDirectory implements GeoDirectory {
  private readonly logger = new Logger(HttpGeoDirectory.name);
  private readonly cache = new Map<number, Cached>();

  constructor(@Inject(ENV) private readonly env: Env) {}

  async communeInWilaya(wilayaCode: number, communeId: number): Promise<boolean | null> {
    const communeIds = await this.communesOf(wilayaCode);
    return communeIds === null ? null : communeIds.has(communeId);
  }

  private async communesOf(wilayaCode: number): Promise<ReadonlySet<number> | null> {
    const cached = this.cache.get(wilayaCode);
    if (cached && cached.until > Date.now()) return cached.communeIds;
    const communeIds = await this.fetchCommunes(wilayaCode);
    if (communeIds) this.cache.set(wilayaCode, { communeIds, until: Date.now() + CACHE_MS });
    return communeIds;
  }

  private async fetchCommunes(wilayaCode: number): Promise<ReadonlySet<number> | null> {
    const url = new URL(`/geo/wilayas/${wilayaCode}/communes`, this.env.SHIPPING_URL);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      // An unknown wilaya is answered 4xx: no commune belongs to it.
      if (response.status >= 400 && response.status < 500) return new Set();
      if (!response.ok) throw new Error(`shipping answered ${response.status}`);
      const body = CommuneIdsSchema.parse(await response.json());
      return new Set(body.items.map((commune) => commune.id));
    } catch (error) {
      this.logger.warn({ err: error, wilayaCode }, 'commune check skipped: geo data unavailable');
      return null;
    }
  }
}
