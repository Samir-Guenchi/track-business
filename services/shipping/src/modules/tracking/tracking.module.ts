import { Module } from '@nestjs/common';
import { TRACKING_REPOSITORY } from './application/ports/tracking.repository.js';
import { TRACKING_CLOCK, TrackingIngestService } from './application/tracking-ingest.service.js';
import { TrackingQueryService } from './application/tracking-query.service.js';
import { PrismaTrackingRepository } from './infrastructure/prisma-tracking.repository.js';
import { PublicTrackingController } from './interface/public-tracking.controller.js';
import { TrackingController } from './interface/tracking.controller.js';

/** One normalised timeline per parcel (#32). Webhooks and the poller feed TrackingIngestService. */
@Module({
  controllers: [TrackingController, PublicTrackingController],
  providers: [
    TrackingIngestService,
    TrackingQueryService,
    { provide: TRACKING_REPOSITORY, useClass: PrismaTrackingRepository },
    { provide: TRACKING_CLOCK, useValue: () => new Date() },
  ],
  exports: [TrackingIngestService],
})
export class TrackingModule {}
