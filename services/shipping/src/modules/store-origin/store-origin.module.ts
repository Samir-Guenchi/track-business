import { Module } from '@nestjs/common';
import { ApplyStoreProfileUseCase } from './application/apply-store-profile.use-case.js';
import { STORE_ORIGIN_STORE } from './application/store-origin.port.js';
import { PrismaStoreOriginStore } from './infrastructure/prisma-store-origin.store.js';
import { StoreProfileConsumer } from './infrastructure/store-profile.consumer.js';

/** Each store's shipping origin from identity's profile (#160), for prices and suggestions. */
@Module({
  providers: [
    ApplyStoreProfileUseCase,
    StoreProfileConsumer,
    { provide: STORE_ORIGIN_STORE, useClass: PrismaStoreOriginStore },
  ],
  exports: [STORE_ORIGIN_STORE],
})
export class StoreOriginModule {}
