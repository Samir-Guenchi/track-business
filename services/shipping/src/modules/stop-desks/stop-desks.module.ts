import { Module } from '@nestjs/common';
import { CarriersModule } from '../carriers/carriers.module.js';
import { GeoModule } from '../geo/geo.module.js';
import { StopDeskQueries } from './application/stop-desk-queries.js';
import { STOP_DESKS_STORE } from './application/stop-desks.ports.js';
import { SyncStopDesksUseCase } from './application/sync-stop-desks.use-case.js';
import { PrismaStopDesksStore } from './infrastructure/prisma-stop-desks.store.js';
import { StopDesksController } from './interface/stop-desks.controller.js';

/** Stop-desk reference data: the public finder and the sync from carrier lists (#137). */
@Module({
  imports: [CarriersModule, GeoModule],
  controllers: [StopDesksController],
  providers: [
    StopDeskQueries,
    SyncStopDesksUseCase,
    { provide: STOP_DESKS_STORE, useClass: PrismaStopDesksStore },
  ],
})
export class StopDesksModule {}
