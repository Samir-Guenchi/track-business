import { Body, Controller, Get, Inject, Put, Query } from '@nestjs/common';
import {
  type CarrierSuggestion,
  type SuggestCarrierQuery,
  SuggestCarrierQuerySchema,
  type SuggestionSettings,
  SuggestionSettingsSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import {
  SUGGESTION_SETTINGS,
  type SuggestionSettingsStore,
} from '../application/ports/suggestion.ports.js';
import { SuggestCarrierUseCase } from '../application/suggest-carrier.use-case.js';

/** Smart carrier suggestion (#41) for whoever ships parcels (`shipments.manage`). */
@Controller('carriers')
export class SuggestionController {
  constructor(
    private readonly suggest: SuggestCarrierUseCase,
    @Inject(SUGGESTION_SETTINGS) private readonly settings: SuggestionSettingsStore,
  ) {}

  @Get('suggestion')
  @RequirePermission('shipments.manage')
  suggestion(
    @Query(new ZodValidationPipe(SuggestCarrierQuerySchema)) query: SuggestCarrierQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<CarrierSuggestion> {
    return this.suggest.execute({ storeId: store.storeId, ...query });
  }

  @Get('suggestion-settings')
  @RequirePermission('shipments.manage')
  getSettings(@CurrentStore() store: StoreContext): Promise<SuggestionSettings> {
    return this.settings.get(store.storeId);
  }

  /** Weights and routing rules are a store setting: owners and managers (`store.update`). */
  @Put('suggestion-settings')
  @RequirePermission('store.update')
  putSettings(
    @Body(new ZodValidationPipe(SuggestionSettingsSchema)) body: SuggestionSettings,
    @CurrentStore() store: StoreContext,
  ): Promise<SuggestionSettings> {
    return this.settings.put(store.storeId, body);
  }
}
