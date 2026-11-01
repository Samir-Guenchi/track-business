import { Controller, Get, Param } from '@nestjs/common';
import type { RiskScore } from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { GetReturnRiskUseCase } from '../application/get-return-risk.use-case.js';

export const RiskOrderIdPipe = new ZodValidationPipe(z.uuid());

/** Return-risk score of an order (#50), for the order detail and the confirmation centre. */
@Controller('orders')
export class RiskScoreController {
  constructor(private readonly getRisk: GetReturnRiskUseCase) {}

  @Get(':id/risk-score')
  @RequirePermission('orders.read')
  get(
    @Param('id', RiskOrderIdPipe) id: string,
    @CurrentStore() store: StoreContext,
  ): Promise<RiskScore> {
    return this.getRisk.execute(store.storeId, id);
  }
}
