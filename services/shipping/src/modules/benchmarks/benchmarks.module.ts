import { Module } from '@nestjs/common';
import { BENCHMARK_ROWS, BenchmarksService } from './application/benchmarks.service.js';
import { PrismaBenchmarkRows } from './infrastructure/prisma-benchmark-rows.js';
import { BenchmarksController } from './interface/benchmarks.controller.js';

/** Anonymous market benchmarks across stores (#200). */
@Module({
  controllers: [BenchmarksController],
  providers: [BenchmarksService, { provide: BENCHMARK_ROWS, useClass: PrismaBenchmarkRows }],
})
export class BenchmarksModule {}
