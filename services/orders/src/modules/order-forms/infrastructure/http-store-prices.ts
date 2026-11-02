import { Inject, Injectable, Logger } from '@nestjs/common';
import { type StorePricesResponse, StorePricesResponseSchema } from '@trackecom/contracts';
import { INTERNAL_TOKEN_HEADER } from '@trackecom/service-kit';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { StorePriceSource } from '../application/order-forms.ports.js';

/** A price change shows on forms within a minute; a busy landing page asks shipping rarely. */
const CACHE_MS = 60_000;
const TIMEOUT_MS = 2_000;

interface Cached {
  readonly prices: StorePricesResponse;
  readonly until: number;
}

/**
 * Reads the store's delivery prices from shipping (ADR-0004) and keeps them a minute in memory.
 * When shipping is down the form still opens (null): the order is taken and the fee checked later.
 */
@Injectable()
export class HttpStorePrices implements StorePriceSource {
  private readonly logger = new Logger(HttpStorePrices.name);
  private readonly cache = new Map<string, Cached>();

  constructor(@Inject(ENV) private readonly env: Env) {}

  async pricesFor(storeId: string): Promise<StorePricesResponse | null> {
    const cached = this.cache.get(storeId);
    if (cached && cached.until > Date.now()) return cached.prices;
    const prices = await this.fetchPrices(storeId);
    if (prices) this.cache.set(storeId, { prices, until: Date.now() + CACHE_MS });
    return prices;
  }

  private async fetchPrices(storeId: string): Promise<StorePricesResponse | null> {
    const token = this.env.INTERNAL_TOKEN;
    const url = new URL(`/internal/stores/${storeId}/pricing/store-prices`, this.env.SHIPPING_URL);
    try {
      if (!token) throw new Error('INTERNAL_TOKEN is not set');
      const response = await fetch(url, {
        headers: { [INTERNAL_TOKEN_HEADER]: token },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`shipping answered ${response.status}`);
      return StorePricesResponseSchema.parse(await response.json());
    } catch (error) {
      this.logger.warn({ err: error, storeId }, 'store prices unavailable for an order form');
      return null;
    }
  }
}
