import { Controller, Get, Inject, Query } from '@nestjs/common';
import { AUDIT_TRAIL_READER, type AuditTrailReader } from '@trackecom/audit';
import {
  type ListAuditQuery,
  ListAuditQuerySchema,
  type ListAuditResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { CurrentStore } from '../../authorization/request-context.js';
import type { StoreContext } from '../stores/domain/store-context.js';

/** `GET /audit?entity=membership&id=...`: one record's history in the selected store (#20). */
@Controller('audit')
export class AuditController {
  constructor(@Inject(AUDIT_TRAIL_READER) private readonly reader: AuditTrailReader) {}

  @Get()
  @RequirePermission('audit.read')
  async list(
    @CurrentStore() store: StoreContext,
    @Query(new ZodValidationPipe(ListAuditQuerySchema)) query: ListAuditQuery,
  ): Promise<ListAuditResponse> {
    const page = await this.reader.list({
      storeId: store.storeId,
      entity: query.entity,
      entityId: query.id,
      limit: query.limit,
      ...(query.cursor ? { cursor: query.cursor } : {}),
    });
    return { items: [...page.items], nextCursor: page.nextCursor };
  }
}
