import { Inject, Injectable, Logger } from '@nestjs/common';
import { type LocatePlacesResponse, LocatePlacesResponseSchema } from '@trackecom/contracts';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { PlaceLocator } from '../application/parse-order-text.use-case.js';

const TIMEOUT_MS = 2_000;

/**
 * Asks shipping's geo module (the owner of the reference data) which places a message names.
 * When shipping is down the agent still gets the phone and name (null places). The text is a
 * customer's message, so it is never logged, only the failure.
 */
@Injectable()
export class HttpPlaceLocator implements PlaceLocator {
  private readonly logger = new Logger(HttpPlaceLocator.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  async locate(text: string): Promise<LocatePlacesResponse | null> {
    try {
      const response = await fetch(new URL('/geo/locate', this.env.SHIPPING_URL), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`shipping answered ${response.status}`);
      return LocatePlacesResponseSchema.parse(await response.json());
    } catch (error) {
      this.logger.warn({ err: error }, 'smart paste without places: geo locator unavailable');
      return null;
    }
  }
}
