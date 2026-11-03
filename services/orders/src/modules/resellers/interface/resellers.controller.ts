import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  type ListResellerOrdersResponse,
  type ListResellersResponse,
  type Reseller,
  ResellerInputSchema,
  type ResellerPayoutResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import type { ResellerFields } from '../application/resellers.ports.js';
import { ResellersService } from '../application/resellers.service.js';

const id = () => new ZodValidationPipe(z.uuid());

/** The supplier's resellers (#198): who sells, how well, and what they are owed. */
@Controller('resellers')
export class ResellersController {
  constructor(private readonly resellers: ResellersService) {}

  @Get()
  @RequirePermission('orders.read')
  list(@CurrentStore() store: StoreContext): Promise<ListResellersResponse> {
    return this.resellers.list(store.storeId);
  }

  @Post()
  @RequirePermission('store.update')
  create(
    @Body(new ZodValidationPipe(ResellerInputSchema)) body: ResellerFields,
    @CurrentStore() store: StoreContext,
  ): Promise<Reseller> {
    return this.resellers.create(store.storeId, body);
  }

  @Patch(':id')
  @RequirePermission('store.update')
  update(
    @Param('id', id()) resellerId: string,
    @Body(new ZodValidationPipe(ResellerInputSchema)) body: ResellerFields,
    @CurrentStore() store: StoreContext,
  ): Promise<Reseller> {
    return this.resellers.update({ storeId: store.storeId, resellerId }, body);
  }

  @Get(':id/orders')
  @RequirePermission('orders.read')
  orders(
    @Param('id', id()) resellerId: string,
    @CurrentStore() store: StoreContext,
  ): Promise<ListResellerOrdersResponse> {
    return this.resellers.orders({ storeId: store.storeId, resellerId });
  }

  @Post(':id/payout')
  @RequirePermission('money.manage')
  payout(
    @Param('id', id()) resellerId: string,
    @CurrentStore() store: StoreContext,
  ): Promise<ResellerPayoutResponse> {
    return this.resellers.payout({ storeId: store.storeId, resellerId });
  }
}
