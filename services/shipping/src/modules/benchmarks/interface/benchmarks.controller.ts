import { Controller, Get, Query } from '@nestjs/common';
import {
  type BenchmarkQuery,
  BenchmarkQuerySchema,
  type BenchmarkResponse,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { BenchmarksService } from '../application/benchmarks.service.js';

/** The store's delivery rate next to the anonymous market rate (#200). */
@Controller('benchmarks')
export class BenchmarksController {
  constructor(private readonly benchmarks: BenchmarksService) {}

  @Get()
  @RequirePermission('orders.read')
  get(
    @Query(new ZodValidationPipe(BenchmarkQuerySchema)) query: BenchmarkQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<BenchmarkResponse> {
    return this.benchmarks.benchmark(store.storeId, query.days);
  }
}
