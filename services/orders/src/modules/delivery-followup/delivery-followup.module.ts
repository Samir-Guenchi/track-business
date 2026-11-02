import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { DecideFollowupUseCase } from './application/decide-followup.use-case.js';
import { FOLLOWUP_STORE } from './application/followup.ports.js';
import { TrackFollowupsUseCase } from './application/track-followups.use-case.js';
import { FollowupConsumer } from './infrastructure/followup.consumer.js';
import { PrismaFollowupStore } from './infrastructure/prisma-followup.store.js';
import { FollowupsController } from './interface/followups.controller.js';

/** Failed-delivery follow-up (#132): open on a failed attempt, decide, close on the outcome. */
@Module({
  imports: [OrdersModule],
  controllers: [FollowupsController],
  providers: [
    TrackFollowupsUseCase,
    DecideFollowupUseCase,
    FollowupConsumer,
    { provide: FOLLOWUP_STORE, useClass: PrismaFollowupStore },
  ],
})
export class DeliveryFollowupModule {}
