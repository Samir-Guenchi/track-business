import { Controller, Get, Param } from '@nestjs/common';
import type { FeeAudit } from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { FeeAuditUseCase } from '../application/fee-audit.use-case.js';

/** Carrier fees on a payout checked against the rate card (#196). */
@Controller('payouts')
export class FeeAuditController {
  constructor(private readonly audit: FeeAuditUseCase) {}

  @Get(':id/fee-audit')
  @RequirePermission('money.read')
  get(
    @Param('id', new ZodValidationPipe(z.uuid())) id: string,
    @CurrentStore() store: StoreContext,
  ): Promise<FeeAudit> {
    return this.audit.execute(store.storeId, id);
  }
}
