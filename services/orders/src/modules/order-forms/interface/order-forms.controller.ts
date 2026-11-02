import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  type CreateOrderFormRequest,
  CreateOrderFormRequestSchema,
  type ListOrderFormsResponse,
  type OrderForm,
  type UpdateOrderFormRequest,
  UpdateOrderFormRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { OrderIdPipe } from '../../orders/interface/orders.controller.js';
import { OrderFormsService } from '../application/order-forms.service.js';
import { toOrderForm } from './order-form.dto.js';

/** The seller's order forms (#134), one per landing page, scoped to the store in `x-store-id`. */
@Controller('orders/forms')
export class OrderFormsController {
  constructor(private readonly forms: OrderFormsService) {}

  @Get()
  @RequirePermission('store.read')
  async list(@CurrentStore() store: StoreContext): Promise<ListOrderFormsResponse> {
    return { items: (await this.forms.list(store.storeId)).map(toOrderForm) };
  }

  @Post()
  @RequirePermission('store.update')
  async create(
    @Body(new ZodValidationPipe(CreateOrderFormRequestSchema)) body: CreateOrderFormRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<OrderForm> {
    return toOrderForm(await this.forms.create(store.storeId, body));
  }

  @Put(':id')
  @RequirePermission('store.update')
  async update(
    @Param('id', OrderIdPipe) id: string,
    @Body(new ZodValidationPipe(UpdateOrderFormRequestSchema)) body: UpdateOrderFormRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<OrderForm> {
    return toOrderForm(await this.forms.update(store.storeId, id, body));
  }
}
