import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  type ResellerCatalogue,
  type ResellerProduct,
  ResellerProductInputSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import type { ProductFields } from '../application/resellers.ports.js';
import { ResellersService } from '../application/resellers.service.js';

/** The products the supplier offers resellers, at the supplier price (#198). */
@Controller('resellers/catalogue')
export class ResellerCatalogueController {
  constructor(private readonly resellers: ResellersService) {}

  @Get()
  @RequirePermission('orders.read')
  list(@CurrentStore() store: StoreContext): Promise<ResellerCatalogue> {
    return this.resellers.catalogue(store.storeId);
  }

  @Post()
  @RequirePermission('store.update')
  create(
    @Body(new ZodValidationPipe(ResellerProductInputSchema)) body: ProductFields,
    @CurrentStore() store: StoreContext,
  ): Promise<ResellerProduct> {
    return this.resellers.createProduct(store.storeId, body);
  }

  @Patch(':id')
  @RequirePermission('store.update')
  update(
    @Param('id', new ZodValidationPipe(z.uuid())) productId: string,
    @Body(new ZodValidationPipe(ResellerProductInputSchema)) body: ProductFields,
    @CurrentStore() store: StoreContext,
  ): Promise<ResellerProduct> {
    return this.resellers.updateProduct({ storeId: store.storeId, productId }, body);
  }
}
