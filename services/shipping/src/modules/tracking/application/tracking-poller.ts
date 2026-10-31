import { Inject, Injectable, Logger } from '@nestjs/common';
import { CarrierAccountsService } from '../../carriers/application/carrier-accounts.service.js';
import { CarrierNotConnectedError } from '../../carriers/domain/carrier-account.errors.js';
import {
  type DueShipment,
  SHIPMENT_POLL_QUEUE,
  type ShipmentPollQueue,
} from './ports/poll-queue.js';
import { TrackingIngestService } from './tracking-ingest.service.js';

const BATCH = 20;
const MINUTE = 60_000;
/** A poll that crashes or hangs is retried after this. */
const LEASE_MS = 5 * MINUTE;
/** A store that disconnected its carrier is checked again much later. */
const DISCONNECTED_RETRY_MS = 6 * 60 * MINUTE;
const CARRIER_TIMEOUT_MS = 20_000;

/**
 * Polling fallback (#32): asks the carrier for every due shipment and feeds the same ingest path
 * as webhooks. The ingest sets the next poll from the new status.
 */
@Injectable()
export class TrackingPoller {
  private readonly logger = new Logger(TrackingPoller.name);

  constructor(
    @Inject(SHIPMENT_POLL_QUEUE) private readonly queue: ShipmentPollQueue,
    private readonly carriers: CarrierAccountsService,
    private readonly ingest: TrackingIngestService,
  ) {}

  async runOnce(): Promise<number> {
    const due = await this.queue.claimDue({ limit: BATCH, leaseMs: LEASE_MS });
    for (const shipment of due) await this.pollOne(shipment);
    return due.length;
  }

  private async pollOne(shipment: DueShipment): Promise<void> {
    const { storeId, carrier, trackingNumber } = shipment;
    try {
      const { adapter, ctx } = await this.carriers.connection(storeId, carrier);
      const signal = AbortSignal.timeout(CARRIER_TIMEOUT_MS);
      const update = await adapter.getTracking({ ...ctx, signal }, trackingNumber);
      await this.ingest.ingest({ storeId, carrier }, update);
    } catch (error) {
      if (error instanceof CarrierNotConnectedError) {
        await this.queue.postpone(shipment.id, DISCONNECTED_RETRY_MS);
        return;
      }
      this.logger.warn(
        `Polling ${carrier} for shipment ${shipment.id} failed: ${(error as Error).message}`,
      );
    }
  }
}
