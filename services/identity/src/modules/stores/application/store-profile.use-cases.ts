import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  STORE_EVENTS,
  type StoreProfile,
  type StoreProfileUpdatedEvent,
  type UpdateStoreProfileRequest,
} from '@trackecom/contracts';
import { outboxMessage } from '../../../shared/outbox-message.js';
import type { StoreContext } from '../domain/store-context.js';
import { applyProfileChange, changedFields } from '../domain/store-profile.js';
import { STORE_PROFILES, type StoreProfileRepository } from './ports/store-profile.port.js';
import { StoreAudit } from './store-audit.js';

const eventData = (storeId: string, profile: StoreProfile): StoreProfileUpdatedEvent => ({
  storeId,
  originWilayaCode: profile.originWilayaCode,
  originCommuneId: profile.originCommuneId,
  logoUrl: profile.logoUrl,
  defaultLanguage: profile.defaultLanguage,
});

@Injectable()
export class StoreProfileUseCases {
  constructor(
    @Inject(STORE_PROFILES) private readonly profiles: StoreProfileRepository,
    private readonly audit: StoreAudit,
  ) {}

  get(context: StoreContext): Promise<StoreProfile> {
    return this.profiles.get(context.storeId);
  }

  /** Audited, and announced so shipping and the tracking page follow (#160). */
  update(context: StoreContext, request: UpdateStoreProfileRequest): Promise<StoreProfile> {
    const { storeId } = context;
    return this.profiles.update({
      storeId,
      change: (before) => applyProfileChange(before, request),
      audit: (before, after) =>
        this.audit.entry(context, {
          entity: 'store',
          entityId: storeId,
          action: 'store.profile_updated',
          ...changedFields(before, after),
        }),
      event: (after) =>
        outboxMessage(
          { storeId, correlationId: randomUUID(), now: new Date() },
          STORE_EVENTS.profileUpdated,
          eventData(storeId, after),
        ),
    });
  }
}
