import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  STORE_LEGAL_EVENTS,
  type StoreLegalProfile,
  type UpdateStoreLegalProfileRequest,
} from '@trackecom/contracts';
import { outboxMessage } from '../../../shared/outbox-message.js';
import type { StoreContext } from '../domain/store-context.js';
import { applyLegalChange } from '../domain/store-legal-profile.js';
import { changedFields } from '../domain/store-profile.js';
import {
  STORE_LEGAL_PROFILES,
  type StoreLegalProfileRepository,
} from './ports/store-legal-profile.port.js';
import { StoreAudit } from './store-audit.js';

@Injectable()
export class StoreLegalProfileUseCases {
  constructor(
    @Inject(STORE_LEGAL_PROFILES) private readonly profiles: StoreLegalProfileRepository,
    private readonly audit: StoreAudit,
  ) {}

  get(context: StoreContext): Promise<StoreLegalProfile> {
    return this.profiles.get(context.storeId);
  }

  /** Audited, and announced so orders keeps the copy it prints on invoices (#140). */
  update(
    context: StoreContext,
    request: UpdateStoreLegalProfileRequest,
  ): Promise<StoreLegalProfile> {
    const { storeId } = context;
    return this.profiles.update({
      storeId,
      change: (before) => applyLegalChange(before, request),
      audit: (before, after) =>
        this.audit.entry(context, {
          entity: 'store',
          entityId: storeId,
          action: 'store.legal_updated',
          ...changedFields(before, after),
        }),
      event: (after) =>
        outboxMessage(
          { storeId, correlationId: randomUUID(), now: new Date() },
          STORE_LEGAL_EVENTS.legalUpdated,
          { ...after, storeId },
        ),
    });
  }
}
