import { Inject, Injectable } from '@nestjs/common';
import type { ShipmentCreatedEvent } from '@trackecom/contracts';
import { ConnectorError } from '@trackecom/connectors';
import { type Env, ENV } from '../../../config/env.schema.js';
import { ConnectionsService } from '../../connections/application/connections.service.js';
import type { FulfilmentTarget } from './ports/fulfilment.ports.js';

export type FulfilOutcome = 'pushed' | 'unsupported' | 'rejected' | 'reconnect';

/** Calls the shop with our public tracking link, never the carrier's. */
@Injectable()
export class ShopFulfiller {
  constructor(
    private readonly connections: ConnectionsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Outages throw so the bus retries; a refusal is an outcome, not worth retrying. */
  async push(target: FulfilmentTarget, data: ShipmentCreatedEvent): Promise<FulfilOutcome> {
    const { connector, ctx } = await this.connections.open(target.connection);
    if (!connector.capabilities.fulfilment) return 'unsupported';
    const base = this.env.TRACKING_URL.replace(/\/$/, '');
    try {
      await connector.pushFulfilment(ctx, {
        externalId: target.externalId,
        carrierName: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: `${base}/${data.publicCode}`,
      });
      return 'pushed';
    } catch (error) {
      if (!(error instanceof ConnectorError) || error.retryable) throw error;
      return error.kind === 'auth' ? 'reconnect' : 'rejected';
    }
  }
}
