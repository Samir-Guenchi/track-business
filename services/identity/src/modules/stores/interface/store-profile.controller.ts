import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  type StoreProfile,
  type UpdateStoreProfileRequest,
  UpdateStoreProfileRequestSchema,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { CurrentStore } from '../../../authorization/request-context.js';
import { StoreProfileUseCases } from '../application/store-profile.use-cases.js';
import type { StoreContext } from '../domain/store-context.js';

/** The store profile (#160): origin, contact, volume, carriers, language. */
@Controller('stores/current/profile')
export class StoreProfileController {
  constructor(private readonly profiles: StoreProfileUseCases) {}

  @Get()
  @RequirePermission('store.read')
  get(@CurrentStore() store: StoreContext): Promise<StoreProfile> {
    return this.profiles.get(store);
  }

  @Patch()
  @RequirePermission('store.update')
  update(
    @CurrentStore() store: StoreContext,
    @Body(new ZodValidationPipe(UpdateStoreProfileRequestSchema)) body: UpdateStoreProfileRequest,
  ): Promise<StoreProfile> {
    return this.profiles.update(store, body);
  }
}
