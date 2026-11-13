import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import { type FormLimits, FormLimitsSchema } from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { FORM_LIMITS_STORE, type FormLimitsStore } from '../application/order-forms.ports.js';

/** The store's anti-spam limits for every order form (#134); stricter than the platform only. */
@Controller('orders/forms/limits')
export class FormLimitsController {
  constructor(@Inject(FORM_LIMITS_STORE) private readonly limits: FormLimitsStore) {}

  @Get()
  @RequirePermission('store.read')
  get(@CurrentStore() store: StoreContext): Promise<FormLimits> {
    return this.limits.get(store.storeId);
  }

  @Put()
  @RequirePermission('store.update')
  put(
    @Body(new ZodValidationPipe(FormLimitsSchema)) body: FormLimits,
    @CurrentStore() store: StoreContext,
  ): Promise<FormLimits> {
    return this.limits.put(store.storeId, body);
  }
}
