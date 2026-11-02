import { Inject, Injectable } from '@nestjs/common';
import type { CarrierStopDesk } from '@trackecom/carriers';
import type { SyncStopDesksResponse } from '@trackecom/contracts';
import { CarrierAccountsService } from '../../carriers/application/carrier-accounts.service.js';
import { GeoCatalog } from '../../geo/application/geo-catalog.js';
import { STOP_DESKS_STORE, type StopDesksStore, type SyncedDesk } from './stop-desks.ports.js';

/** Below this a carrier's commune spelling is too far from ours to trust the match. */
const MIN_MATCH_SCORE = 0.6;

/**
 * Pulls a carrier's stop-desk list with the store's credentials and saves it as shared reference
 * data (#137). Desks are the same for every store, so one store's sync serves all.
 */
@Injectable()
export class SyncStopDesksUseCase {
  constructor(
    private readonly carriers: CarrierAccountsService,
    private readonly geo: GeoCatalog,
    @Inject(STOP_DESKS_STORE) private readonly store: StopDesksStore,
  ) {}

  async execute(storeId: string, carrier: string): Promise<SyncStopDesksResponse> {
    const { adapter, ctx } = await this.carriers.connection(storeId, carrier);
    const desks = await adapter.listStopDesks(ctx);
    const matched: SyncedDesk[] = [];
    const unmatched: SyncStopDesksResponse['unmatched'] = [];
    for (const desk of desks) {
      const communeId = await this.communeOf(desk);
      if (communeId === null) unmatched.push({ code: desk.code, communeName: desk.communeName });
      else matched.push({ code: desk.code, name: desk.name, address: desk.address, communeId });
    }
    const saved = await this.store.saveSynced(carrier, matched);
    return { carrier, saved, unmatched };
  }

  private async communeOf(desk: CarrierStopDesk): Promise<number | null> {
    const options = { limit: 1, wilayaCode: desk.wilayaCode };
    const [best] = await this.geo.search(desk.communeName, options);
    return best && best.score >= MIN_MATCH_SCORE ? best.commune.id : null;
  }
}
