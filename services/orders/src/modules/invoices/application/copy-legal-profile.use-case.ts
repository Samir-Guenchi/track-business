import { Inject, Injectable } from '@nestjs/common';
import { type EventEnvelope, StoreLegalUpdatedEventSchema } from '@trackecom/contracts';
import { LEGAL_COPIES, type LegalCopyRepository } from './ports/legal-copy.port.js';

/** One consumer group for every replica of orders reading identity's stream. */
export const LEGAL_COPY_CONSUMER = 'orders.legal-copy';

/**
 * Keeps orders' copy of the store legal profile (#140). The event carries the whole profile, so
 * applying it twice is harmless and an older event arriving late is ignored. A payload naming
 * another store than its envelope is ignored too.
 */
@Injectable()
export class CopyLegalProfileUseCase {
  constructor(@Inject(LEGAL_COPIES) private readonly copies: LegalCopyRepository) {}

  execute(event: EventEnvelope): Promise<boolean> {
    const { storeId, ...profile } = StoreLegalUpdatedEventSchema.parse(event.data);
    if (storeId !== event.storeId) return Promise.resolve(false);
    return this.copies.save(storeId, profile, new Date(event.occurredAt));
  }
}
