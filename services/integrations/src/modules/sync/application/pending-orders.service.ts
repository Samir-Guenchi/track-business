import { Inject, Injectable } from '@nestjs/common';
import type { ResolvePendingOrderRequest } from '@trackecom/contracts';
import type { ExternalOrder } from '@trackecom/connectors';
import { receivedOrderOf } from '../domain/received-order.js';
import { PendingOrderNotFoundError, StillNeedsFixError } from '../domain/sync.errors.js';
import {
  type GeoReference,
  type ImportLedger,
  type PendingKey,
  type PendingOrder,
  type PendingOrders,
  SYNC_PORTS,
} from './ports/sync.ports.js';
import { receivedMessage } from './received-message.js';

/**
 * The seller's queue of shop orders that could not be imported on their own. Resolving places
 * the customer (the commune must belong to the wilaya) and sends the order like any other;
 * skipping drops the shop data and the order is never imported.
 */
@Injectable()
export class PendingOrdersService {
  constructor(
    @Inject(SYNC_PORTS.pending) private readonly pending: PendingOrders,
    @Inject(SYNC_PORTS.ledger) private readonly ledger: ImportLedger,
    @Inject(SYNC_PORTS.geo) private readonly geo: GeoReference,
  ) {}

  list(storeId: string): Promise<PendingOrder[]> {
    return this.pending.list(storeId);
  }

  async resolve(storeId: string, request: ResolvePendingOrderRequest): Promise<void> {
    const { connection, order } = await this.take(storeId, request);
    const communes = await this.geo.communes(request.wilayaCode);
    if (!communes.some((commune) => commune.id === request.communeId)) {
      throw new StillNeedsFixError('address');
    }
    const fixed = patched(order, request);
    const location = { wilayaCode: request.wilayaCode, communeId: request.communeId };
    const mapped = receivedOrderOf(connection.connector, fixed, location);
    if (!mapped.ok) throw new StillNeedsFixError(mapped.problem);
    const entry = { connection, order: fixed, state: 'sent' as const, problem: null };
    await this.ledger.record(entry, [receivedMessage(connection, mapped.data)]);
  }

  async skip(storeId: string, key: PendingKey): Promise<void> {
    const { connection, order } = await this.take(storeId, key);
    await this.ledger.record({ connection, order, state: 'skipped', problem: null }, []);
  }

  private async take(storeId: string, key: PendingKey): Promise<PendingOrder> {
    const found = await this.pending.find(storeId, key);
    if (!found) throw new PendingOrderNotFoundError();
    return found;
  }
}

const patched = (order: ExternalOrder, fix: ResolvePendingOrderRequest): ExternalOrder => ({
  ...order,
  customer: {
    ...order.customer,
    phone: fix.phone ?? order.customer.phone,
    address: fix.address ?? order.customer.address,
  },
});
