import { Injectable } from '@nestjs/common';
import { CarrierError, type WebhookRequest } from '@trackecom/carriers';
import { CarrierAccountsService } from '../../carriers/application/carrier-accounts.service.js';
import { WebhookRejectedError, WebhooksNotSupportedError } from '../domain/tracking.errors.js';
import { TrackingIngestService } from './tracking-ingest.service.js';

export interface IncomingWebhook {
  readonly storeId: string;
  readonly carrier: string;
  readonly request: WebhookRequest;
}

/**
 * Carrier pushes (#32). Each store registers its own URL with the carrier, so the store's own
 * credentials verify the signature and only that store's parcels can change.
 */
@Injectable()
export class CarrierWebhookService {
  constructor(
    private readonly carriers: CarrierAccountsService,
    private readonly ingest: TrackingIngestService,
  ) {}

  /** Returns how many parcels the webhook updated. */
  async receive({ storeId, carrier, request }: IncomingWebhook): Promise<number> {
    const { adapter, ctx } = await this.carriers.connection(storeId, carrier);
    if (!adapter.capabilities.webhooks) throw new WebhooksNotSupportedError(carrier);
    const updates = await adapter.parseWebhook(ctx, request).catch((error: unknown) => {
      if (error instanceof CarrierError && error.kind === 'auth') {
        throw new WebhookRejectedError('Webhook signature does not match');
      }
      throw error;
    });
    let applied = 0;
    for (const update of updates) {
      if (await this.ingest.ingest({ storeId, carrier }, update)) applied += 1;
    }
    return applied;
  }
}
