import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ORDER_HISTORY_WRITER } from './application/order-history.port.js';
import { RecordDeliveryRequestUseCase } from './application/record-delivery-request.use-case.js';
import { DeliveryRequestConsumer } from './infrastructure/delivery-request.consumer.js';
import { PrismaOrderHistoryWriter } from './infrastructure/prisma-order-history.writer.js';

/** Customer delivery requests from the tracking link (#136), shown in the order history. */
@Module({
  imports: [OrdersModule],
  providers: [
    RecordDeliveryRequestUseCase,
    DeliveryRequestConsumer,
    { provide: ORDER_HISTORY_WRITER, useClass: PrismaOrderHistoryWriter },
  ],
})
export class DeliveryRequestsModule {}
