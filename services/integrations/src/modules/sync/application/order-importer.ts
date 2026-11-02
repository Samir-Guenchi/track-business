import { Inject, Injectable } from '@nestjs/common';
import type { ExternalOrder } from '@trackecom/connectors';
import type { ConnectionRecord } from '../../connections/application/ports/connection.repository.js';
import { cancellationOf, type Mapped, receivedOrderOf } from '../domain/received-order.js';
import { LocationResolver } from './location-resolver.js';
import { receivedMessage } from './received-message.js';
import {
  type ImportLedger,
  type ImportState,
  type KnownOrder,
  SYNC_PORTS,
} from './ports/sync.ports.js';

type Decision = { state: ImportState; mapped: Mapped | null };

/**
 * Turns shop orders into `integrations.order.received.v1`, each at most once per shop change.
 * A new order goes out when it can be placed and checked, or waits for the seller with its
 * problem. A cancellation goes out only for an order already sent; later edits of a sent order
 * are not resent, so the shop never overwrites what an agent confirmed.
 */
@Injectable()
export class OrderImporter {
  constructor(
    @Inject(SYNC_PORTS.ledger) private readonly ledger: ImportLedger,
    private readonly locations: LocationResolver,
  ) {}

  /** Returns how many events it emitted. */
  async import(connection: ConnectionRecord, orders: readonly ExternalOrder[]): Promise<number> {
    const ids = orders.map((order) => order.externalId);
    const known = await this.ledger.known(connection.id, ids);
    let emitted = 0;
    for (const order of orders) {
      const before = known.get(order.externalId);
      if (before && before.shopUpdatedAt >= order.updatedAt) continue;
      const decision = await this.decide(connection, order, before);
      const messages = decision.mapped?.ok
        ? [receivedMessage(connection, decision.mapped.data)]
        : [];
      const problem = decision.mapped && !decision.mapped.ok ? decision.mapped.problem : null;
      await this.ledger.record({ connection, order, state: decision.state, problem }, messages);
      emitted += messages.length;
    }
    return emitted;
  }

  private async decide(
    connection: ConnectionRecord,
    order: ExternalOrder,
    before: KnownOrder | undefined,
  ): Promise<Decision> {
    if (order.cancelled) {
      if (before?.state !== 'sent') return { state: 'skipped', mapped: null };
      return { state: 'sent', mapped: cancellationOf(connection.connector, order) };
    }
    if (before?.state === 'sent') return { state: 'sent', mapped: null };
    const location = await this.locations.resolve(order.customer);
    const mapped = receivedOrderOf(connection.connector, order, location);
    return { state: mapped.ok ? 'sent' : 'needs_fix', mapped };
  }
}
