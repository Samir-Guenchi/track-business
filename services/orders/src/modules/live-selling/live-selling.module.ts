import { Module } from '@nestjs/common';
import { LIVE_SESSIONS_STORE } from './application/live-selling.ports.js';
import { LiveSellingService } from './application/live-selling.service.js';
import { PrismaLiveSessionsStore } from './infrastructure/prisma-live-sessions.store.js';
import { LiveSellingController } from './interface/live-selling.controller.js';

/** Live selling (#199): TikTok and Facebook live comments become reservations, then orders. */
@Module({
  controllers: [LiveSellingController],
  providers: [
    LiveSellingService,
    { provide: LIVE_SESSIONS_STORE, useClass: PrismaLiveSessionsStore },
  ],
})
export class LiveSellingModule {}
