import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExpectedFeesResponseSchema } from '@trackecom/contracts';
import { INTERNAL_TOKEN_HEADER } from '@trackecom/service-kit';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { ExpectedFeesSource } from '../application/fee-audit.use-case.js';
import type { ExpectedFee } from '../domain/fee-audit.js';

const TIMEOUT_MS = 5_000;

/**
 * Asks shipping (owner of rate cards and parcel destinations, ADR-0004) what each parcel should
 * cost. When it cannot be reached the audit still runs its rate-free checks (null).
 */
@Injectable()
export class HttpExpectedFees implements ExpectedFeesSource {
  private readonly logger = new Logger(HttpExpectedFees.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  async forParcels(query: {
    storeId: string;
    carrier: string;
    trackingNumbers: string[];
  }): Promise<ExpectedFee[] | null> {
    const token = this.env.INTERNAL_TOKEN;
    const url = new URL(`/internal/stores/${query.storeId}/carrier-fees`, this.env.SHIPPING_URL);
    try {
      if (!token) throw new Error('INTERNAL_TOKEN is not set');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [INTERNAL_TOKEN_HEADER]: token },
        body: JSON.stringify({ carrier: query.carrier, trackingNumbers: query.trackingNumbers }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`shipping answered ${response.status}`);
      return ExpectedFeesResponseSchema.parse(await response.json()).items;
    } catch (error) {
      this.logger.warn({ err: error, storeId: query.storeId }, 'fee audit without rate cards');
      return null;
    }
  }
}
