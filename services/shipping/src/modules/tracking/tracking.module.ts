import { Module } from '@nestjs/common';
import { CarriersModule } from '../carriers/carriers.module.js';
import { EtaModule } from '../eta/eta.module.js';
import { CarrierWebhookService } from './application/carrier-webhook.service.js';
import { SHIPMENT_POLL_QUEUE } from './application/ports/poll-queue.js';
import { TRACKING_REPOSITORY } from './application/ports/tracking.repository.js';
import { TRACKING_CLOCK, TrackingIngestService } from './application/tracking-ingest.service.js';
import { TrackingPoller } from './application/tracking-poller.js';
import { TrackingQueryService } from './application/tracking-query.service.js';
import { PrismaShipmentPollQueue } from './infrastructure/prisma-poll-queue.js';
import { PrismaTrackingRepository } from './infrastructure/prisma-tracking.repository.js';
import { TrackingPollerWorker } from './infrastructure/tracking-poller.worker.js';
import { CarrierWebhookController } from './interface/carrier-webhook.controller.js';
import { PublicTrackingController } from './interface/public-tracking.controller.js';
import { TrackingController } from './interface/tracking.controller.js';

/** One normalised timeline per parcel (#32), fed by carrier webhooks and the polling fallback. */
@Module({
  imports: [CarriersModule, EtaModule],
  controllers: [TrackingController, PublicTrackingController, CarrierWebhookController],
  providers: [
    TrackingIngestService,
    TrackingQueryService,
    TrackingPoller,
    TrackingPollerWorker,
    CarrierWebhookService,
    { provide: TRACKING_REPOSITORY, useClass: PrismaTrackingRepository },
    { provide: SHIPMENT_POLL_QUEUE, useClass: PrismaShipmentPollQueue },
    { provide: TRACKING_CLOCK, useValue: () => new Date() },
  ],
  exports: [TrackingIngestService],
})
export class TrackingModule {}
