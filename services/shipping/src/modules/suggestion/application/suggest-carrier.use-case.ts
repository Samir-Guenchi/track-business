import { Inject, Injectable } from '@nestjs/common';
import type { CarrierSuggestion } from '@trackecom/contracts';
import { suggestCarrier } from '../domain/carrier-suggestion.js';
import {
  CARRIER_FACTS,
  type CarrierFactsSource,
  type RouteQuery,
  SUGGESTION_SETTINGS,
  type SuggestionSettingsStore,
} from './ports/suggestion.ports.js';

/** `GET /carriers/suggestion` (#41): the carrier the ship dialog preselects, and why. */
@Injectable()
export class SuggestCarrierUseCase {
  constructor(
    @Inject(CARRIER_FACTS) private readonly facts: CarrierFactsSource,
    @Inject(SUGGESTION_SETTINGS) private readonly settings: SuggestionSettingsStore,
  ) {}

  async execute(route: RouteQuery): Promise<CarrierSuggestion> {
    const [facts, settings] = await Promise.all([
      this.facts.gather(route),
      this.settings.get(route.storeId),
    ]);
    return suggestCarrier(facts, { ...route, settings });
  }
}
