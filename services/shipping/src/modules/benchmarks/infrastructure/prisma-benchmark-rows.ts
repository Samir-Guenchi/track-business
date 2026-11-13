import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { BenchmarkRows } from '../application/benchmarks.service.js';
import { benchmarkRows } from './benchmark-rows.js';

@Injectable()
export class PrismaBenchmarkRows implements BenchmarkRows {
  constructor(private readonly prisma: PrismaService) {}

  rows(storeId: string, days: number) {
    return benchmarkRows(this.prisma, storeId, days);
  }
}
