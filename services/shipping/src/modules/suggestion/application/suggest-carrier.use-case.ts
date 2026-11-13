import { Inject, Injectable } from '@nestjs/common';
import type { CarrierSuggestion } from '@trackecom/contracts';
import {
  STORE_ORIGIN_STORE,
  type StoreOriginStore,
} from '../../store-origin/application/store-origin.port.js';
import { suggestCarrier } from '../domain/carrier-suggestion.js';
import { OriginUnknownError } from '../domain/suggestion.errors.js';
import {
  CARRIER_FACTS,
  type CarrierFactsSource,
  type RouteQuery,
  SUGGESTION_SETTINGS,
  type SuggestionSettingsStore,
} from './ports/suggestion.ports.js';

/** A route whose origin may be left out: the store profile's origin is used then (#160). */
export type SuggestionRequest = Omit<RouteQuery, 'originWilayaCode'> & {
  readonly originWilayaCode?: number | undefined;
};

/** `GET /carriers/suggestion` (#41): the carrier the ship dialog preselects, and why. */
@Injectable()
export class SuggestCarrierUseCase {
  constructor(
    @Inject(CARRIER_FACTS) private readonly facts: CarrierFactsSource,
    @Inject(SUGGESTION_SETTINGS) private readonly settings: SuggestionSettingsStore,
    @Inject(STORE_ORIGIN_STORE) private readonly origins: StoreOriginStore,
  ) {}

  async execute(request: SuggestionRequest): Promise<CarrierSuggestion> {
    const route = await this.withOrigin(request);
    const [facts, settings] = await Promise.all([
      this.facts.gather(route),
      this.settings.get(route.storeId),
    ]);
    return suggestCarrier(facts, { ...route, settings });
  }

  private async withOrigin(request: SuggestionRequest): Promise<RouteQuery> {
    const origin = request.originWilayaCode ?? (await this.origins.originWilaya(request.storeId));
    if (origin === null) {
      throw new OriginUnknownError('Set the origin wilaya in the store profile, or send it');
    }
    return { ...request, originWilayaCode: origin };
  }
}
