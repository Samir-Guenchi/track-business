import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { CreateExchangeUseCase } from './application/create-exchange.use-case.js';
import { ExchangeController } from './interface/exchange.controller.js';

/** Exchanges (#138): a delivered order's items swapped in one delivery. */
@Module({
  imports: [OrdersModule],
  controllers: [ExchangeController],
  providers: [CreateExchangeUseCase],
})
export class ExchangesModule {}
