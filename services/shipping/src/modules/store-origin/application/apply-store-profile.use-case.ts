import { Inject, Injectable } from '@nestjs/common';
import { type EventEnvelope, StoreProfileUpdatedEventSchema } from '@trackecom/contracts';
import { STORE_ORIGIN_STORE, type StoreOriginStore } from './store-origin.port.js';

export type ApplyResult = 'applied' | 'stale' | 'ignored';

/**
 * The seller saved their store profile (#160): shipping keeps the origin wilaya so prices and
 * carrier suggestions use it without asking again. Applying an event twice changes nothing.
 */
@Injectable()
export class ApplyStoreProfileUseCase {
  constructor(@Inject(STORE_ORIGIN_STORE) private readonly origins: StoreOriginStore) {}

  async execute(event: EventEnvelope): Promise<ApplyResult> {
    const data = StoreProfileUpdatedEventSchema.parse(event.data);
    // The tenant comes from the envelope; a payload naming another store is not trusted.
    if (data.storeId !== event.storeId) return 'ignored';
    const applied = await this.origins.apply(
      event.storeId,
      { wilayaCode: data.originWilayaCode, communeId: data.originCommuneId },
      new Date(event.occurredAt),
    );
    return applied ? 'applied' : 'stale';
  }
}
