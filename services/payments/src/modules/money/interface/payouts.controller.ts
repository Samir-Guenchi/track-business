import { Body, Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import {
  type ImportPayoutRequest,
  ImportPayoutRequestSchema,
  type Payout,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { ImportPayoutUseCase } from '../application/import-payout.use-case.js';
import {
  PAYOUT_REPOSITORY,
  type PayoutRepository,
} from '../application/ports/payout.repository.js';
import { PayoutNotFoundError } from '../domain/payout.errors.js';
import { toPayoutDto } from './payout.mapper.js';

export const PayoutIdPipe = new ZodValidationPipe(z.uuid());

/** Carrier statements (#42): imported by `money.manage`, read by `money.read`. */
@Controller('payouts')
export class PayoutsController {
  constructor(
    private readonly importPayout: ImportPayoutUseCase,
    @Inject(PAYOUT_REPOSITORY) private readonly payouts: PayoutRepository,
  ) {}

  /** 202: the statement is stored; poll it until `status` is `reconciled`. */
  @Post()
  @HttpCode(202)
  @RequirePermission('money.manage')
  async import(
    @Body(new ZodValidationPipe(ImportPayoutRequestSchema)) body: ImportPayoutRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<Payout> {
    return toPayoutDto(await this.importPayout.execute(store.storeId, body));
  }

  @Get(':id')
  @RequirePermission('money.read')
  async get(
    @Param('id', PayoutIdPipe) id: string,
    @CurrentStore() store: StoreContext,
  ): Promise<Payout> {
    const payout = await this.payouts.find(store.storeId, id);
    if (!payout) throw new PayoutNotFoundError();
    return toPayoutDto(payout);
  }
}
