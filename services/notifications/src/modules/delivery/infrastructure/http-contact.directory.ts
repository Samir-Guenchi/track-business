import { Inject, Injectable } from '@nestjs/common';
import { type OrderContact, OrderContactSchema } from '@trackecom/contracts';
import { INTERNAL_TOKEN_HEADER } from '@trackecom/service-kit';
import { type Env, ENV } from '../../../config/env.schema.js';
import type { ContactDirectory } from '../application/ports/delivery.ports.js';

const TIMEOUT_MS = 3_000;

/** Asks orders for the customer at send time (ADR-0004); nothing is cached or stored. */
@Injectable()
export class HttpContactDirectory implements ContactDirectory {
  constructor(@Inject(ENV) private readonly env: Env) {}

  async contactFor(storeId: string, orderId: string): Promise<OrderContact | null> {
    const token = this.env.INTERNAL_TOKEN;
    if (!token) throw new Error('INTERNAL_TOKEN is not set: cannot read contacts from orders');
    const url = new URL(
      `/internal/stores/${storeId}/orders/${orderId}/contact`,
      this.env.ORDERS_URL,
    );
    const response = await fetch(url, {
      headers: { [INTERNAL_TOKEN_HEADER]: token },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`orders answered ${response.status}`);
    return OrderContactSchema.parse(await response.json());
  }
}
