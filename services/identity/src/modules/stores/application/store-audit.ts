import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type AuditEntry, createAuditEntry } from '@trackecom/audit';
import type { StoreContext } from '../domain/store-context.js';

export interface AuditDetails {
  readonly entity: 'store' | 'membership' | 'invitation';
  readonly entityId: string;
  readonly action: string;
  readonly before?: Record<string, unknown> | null;
  readonly after?: Record<string, unknown> | null;
}

/** Builds audit entries for identity actions, attributed to the acting user. */
@Injectable()
export class StoreAudit {
  entry(
    context: Pick<StoreContext, 'storeId' | 'userId' | 'ip'>,
    details: AuditDetails,
  ): AuditEntry {
    return createAuditEntry(
      {
        ...details,
        storeId: context.storeId,
        actor: { type: 'user', id: context.userId },
        ip: context.ip,
      },
      { newId: randomUUID, now: () => new Date() },
    );
  }
}
