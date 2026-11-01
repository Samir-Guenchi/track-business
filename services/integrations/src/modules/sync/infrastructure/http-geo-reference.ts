import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { Place } from '../domain/address-match.js';
import type { GeoReference } from '../application/ports/sync.ports.js';

/** Reference data changes only with a territorial reform, so a few hours of cache is safe. */
const CACHE_MS = 6 * 60 * 60_000;
const TIMEOUT_MS = 5_000;
const WILAYAS = 'wilayas';

/** Only the names are needed; a field shipping adds later must not break matching. */
const PlacesSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().optional(),
      code: z.number().int().optional(),
      nameFr: z.string(),
      nameAr: z.string(),
    }),
  ),
});

/**
 * Reads wilayas and communes from shipping's public geo API and keeps them in memory per replica.
 * Unlike the fraud check, a failure throws: the sync retries later instead of holding orders
 * back for an address problem that is really an outage.
 */
@Injectable()
export class HttpGeoReference implements GeoReference {
  private readonly cache = new Map<string, { places: readonly Place[]; until: number }>();

  constructor(@Inject(ENV) private readonly env: Env) {}

  wilayas(): Promise<readonly Place[]> {
    return this.cached(WILAYAS, '/geo/wilayas');
  }

  communes(wilayaCode: number): Promise<readonly Place[]> {
    return this.cached(String(wilayaCode), `/geo/wilayas/${wilayaCode}/communes`);
  }

  private async cached(key: string, path: string): Promise<readonly Place[]> {
    const hit = this.cache.get(key);
    if (hit && hit.until > Date.now()) return hit.places;
    const response = await fetch(new URL(path, this.env.SHIPPING_URL), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`shipping geo answered ${response.status} for ${path}`);
    const { items } = PlacesSchema.parse(await response.json());
    const places = items.map((item) => ({
      id: item.id ?? item.code ?? 0,
      nameFr: item.nameFr,
      nameAr: item.nameAr,
    }));
    this.cache.set(key, { places, until: Date.now() + CACHE_MS });
    return places;
  }
}
