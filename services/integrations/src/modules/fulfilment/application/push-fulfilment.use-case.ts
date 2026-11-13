import { Inject, Injectable } from '@nestjs/common';
import {
  CONNECTOR_CODES,
  type EventEnvelope,
  ShipmentCreatedEventSchema,
} from '@trackecom/contracts';
import {
  FULFILMENT_PORTS,
  type FulfilmentTarget,
  type FulfilmentTargets,
  type OrderOrigins,
} from './ports/fulfilment.ports.js';
import { type FulfilOutcome, ShopFulfiller } from './shop-fulfiller.js';

export const FULFILMENT_CONSUMER = 'integrations.fulfilment';

export type PushResult = FulfilOutcome | 'not_from_shop' | 'duplicate';

const fromShop = (source: string): boolean =>
  (CONNECTOR_CODES as readonly string[]).includes(source);

/**
 * When shipping creates a parcel for an order imported from a shop, marks the shop order
 * fulfilled (ADR-0003). Connectors make the push idempotent per tracking number, and the inbox
 * keeps a redelivered event from calling the shop again. A refused token flags the shop for
 * reconnecting instead of retrying forever.
 */
@Injectable()
export class PushFulfilmentUseCase {
  constructor(
    @Inject(FULFILMENT_PORTS.origins) private readonly origins: OrderOrigins,
    @Inject(FULFILMENT_PORTS.targets) private readonly targets: FulfilmentTargets,
    private readonly fulfiller: ShopFulfiller,
  ) {}

  async execute(event: EventEnvelope): Promise<PushResult> {
    if (await this.targets.alreadyDone(event.id)) return 'duplicate';
    const data = ShipmentCreatedEventSchema.parse(event.data);
    const target = await this.targetOf(event.storeId, data.orderId);
    const result = target ? await this.fulfiller.push(target, data) : 'not_from_shop';
    if (target && result === 'reconnect') await this.targets.needsReconnect(target.connection);
    await this.targets.markDone(event.id);
    return result;
  }

  private async targetOf(storeId: string, orderId: string): Promise<FulfilmentTarget | null> {
    const origin = await this.origins.originOf(storeId, orderId);
    if (!origin?.externalRef || !fromShop(origin.source)) return null;
    return this.targets.find({ storeId, connector: origin.source, externalId: origin.externalRef });
  }
}
