import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  type StoreLegalProfile,
  type UpdateStoreLegalProfileRequest,
  UpdateStoreLegalProfileRequestSchema,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { CurrentStore } from '../../../authorization/request-context.js';
import { StoreLegalProfileUseCases } from '../application/store-legal-profile.use-cases.js';
import type { StoreContext } from '../domain/store-context.js';

/** The legal identity printed on invoices (#140): regime, NIF, NIS, RC, address. */
@Controller('stores/current/legal')
export class StoreLegalProfileController {
  constructor(private readonly profiles: StoreLegalProfileUseCases) {}

  @Get()
  @RequirePermission('store.read')
  get(@CurrentStore() store: StoreContext): Promise<StoreLegalProfile> {
    return this.profiles.get(store);
  }

  @Patch()
  @RequirePermission('store.update')
  update(
    @CurrentStore() store: StoreContext,
    @Body(new ZodValidationPipe(UpdateStoreLegalProfileRequestSchema))
    body: UpdateStoreLegalProfileRequest,
  ): Promise<StoreLegalProfile> {
    return this.profiles.update(store, body);
  }
}
