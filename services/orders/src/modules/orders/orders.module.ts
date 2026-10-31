import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { AUDIT_TRAIL_READER } from '@trackecom/audit';
import { BulkOrdersUseCase } from './application/bulk-orders.use-case.js';
import { ChangeStatusUseCase } from './application/change-status.use-case.js';
import { CreateOrderUseCase } from './application/create-order.use-case.js';
import { OrderAdminUseCases } from './application/order-admin.use-cases.js';
import { OrderChangeRecorder } from './application/order-change.recorder.js';
import { OrderQueries } from './application/order-queries.js';
import { ORDERS_PORTS } from './application/ports/orders.ports.js';
import { UpdateOrderUseCase } from './application/update-order.use-case.js';
import { PrismaAuditStore } from './infrastructure/prisma-audit.store.js';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository.js';
import { OrderActionsController } from './interface/order-actions.controller.js';
import { OrderDeletionController, OrdersController } from './interface/orders.controller.js';

@Module({
  controllers: [OrdersController, OrderDeletionController, OrderActionsController],
  providers: [
    CreateOrderUseCase,
    UpdateOrderUseCase,
    ChangeStatusUseCase,
    OrderAdminUseCases,
    BulkOrdersUseCase,
    OrderQueries,
    OrderChangeRecorder,
    { provide: ORDERS_PORTS.repository, useClass: PrismaOrderRepository },
    { provide: ORDERS_PORTS.clock, useValue: () => new Date() },
    { provide: ORDERS_PORTS.ids, useValue: randomUUID },
    { provide: AUDIT_TRAIL_READER, useClass: PrismaAuditStore },
  ],
})
export class OrdersModule {}
