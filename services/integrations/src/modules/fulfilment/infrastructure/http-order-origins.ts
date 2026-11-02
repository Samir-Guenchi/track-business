import { Inject, Injectable } from '@nestjs/common';
import { type OrderOrigin, OrderOriginSchema } from '@trackecom/contracts';
import { INTERNAL_TOKEN_HEADER } from '@trackecom/service-kit';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { OrderOrigins } from '../application/ports/fulfilment.ports.js';

const TIMEOUT_MS = 3_000;

/** Reads an order's source from orders' internal route; failures throw so the bus retries. */
@Injectable()
export class HttpOrderOrigins implements OrderOrigins {
  constructor(@Inject(ENV) private readonly env: Env) {}

  async originOf(storeId: string, orderId: string): Promise<OrderOrigin | null> {
    const token = this.env.INTERNAL_TOKEN;
    if (!token) throw new Error('INTERNAL_TOKEN is not set: cannot read order origins');
    const path = `/internal/stores/${storeId}/orders/${orderId}/origin`;
    const response = await fetch(new URL(path, this.env.ORDERS_URL), {
      headers: { [INTERNAL_TOKEN_HEADER]: token },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`orders answered ${response.status}`);
    return OrderOriginSchema.parse(await response.json());
  }
}
