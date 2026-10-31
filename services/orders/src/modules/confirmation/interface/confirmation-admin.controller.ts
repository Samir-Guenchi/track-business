import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  type AgentStatsQuery,
  AgentStatsQuerySchema,
  type AgentStatsResponse,
  type CallScript,
  type CallScriptsResponse,
  type ConfirmationSettings,
  ConfirmationSettingsSchema,
  type ScriptLanguage,
  ScriptLanguageSchema,
  UpdateCallScriptRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { ConfirmationContentService } from '../application/confirmation-content.service.js';
import { ConfirmationSettingsService } from '../application/confirmation-settings.service.js';

/** What owners and managers configure and watch: queue rules, call scripts, agent numbers. */
@Controller('confirmation')
export class ConfirmationAdminController {
  constructor(
    private readonly settings: ConfirmationSettingsService,
    private readonly content: ConfirmationContentService,
  ) {}

  @Get('settings')
  @RequirePermission('store.read')
  getSettings(@CurrentStore() store: StoreContext): Promise<ConfirmationSettings> {
    return this.settings.get(store.storeId);
  }

  @Put('settings')
  @RequirePermission('store.update')
  putSettings(
    @Body(new ZodValidationPipe(ConfirmationSettingsSchema)) body: ConfirmationSettings,
    @CurrentStore() store: StoreContext,
  ): Promise<ConfirmationSettings> {
    return this.settings.replace(store.storeId, body);
  }

  @Get('scripts')
  @RequirePermission('store.read')
  async scripts(@CurrentStore() store: StoreContext): Promise<CallScriptsResponse> {
    return { items: await this.content.scripts(store.storeId) };
  }

  @Put('scripts/:language')
  @RequirePermission('store.update')
  saveScript(
    @Param('language', new ZodValidationPipe(ScriptLanguageSchema)) language: ScriptLanguage,
    @Body(new ZodValidationPipe(UpdateCallScriptRequestSchema)) body: { body: string },
    @CurrentStore() store: StoreContext,
  ): Promise<CallScript> {
    return this.content.saveScript(store.storeId, { language, body: body.body });
  }

  @Get('stats')
  @RequirePermission('members.read')
  stats(
    @Query(new ZodValidationPipe(AgentStatsQuerySchema)) query: AgentStatsQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<AgentStatsResponse> {
    return this.content.stats(store.storeId, query);
  }
}
