import { Module } from '@nestjs/common';
import { StoreOriginModule } from '../store-origin/store-origin.module.js';
import { CARRIER_FACTS, SUGGESTION_SETTINGS } from './application/ports/suggestion.ports.js';
import { SuggestCarrierUseCase } from './application/suggest-carrier.use-case.js';
import { PrismaCarrierFacts } from './infrastructure/prisma-carrier-facts.js';
import { PrismaSuggestionSettings } from './infrastructure/prisma-suggestion-settings.js';
import { SuggestionController } from './interface/suggestion.controller.js';

/** Smart carrier suggestion by wilaya, price and delivery rate (#41). */
@Module({
  imports: [StoreOriginModule],
  controllers: [SuggestionController],
  providers: [
    SuggestCarrierUseCase,
    { provide: CARRIER_FACTS, useClass: PrismaCarrierFacts },
    { provide: SUGGESTION_SETTINGS, useClass: PrismaSuggestionSettings },
  ],
})
export class SuggestionModule {}
