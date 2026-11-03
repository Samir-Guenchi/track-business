import { Inject, Injectable } from '@nestjs/common';
import {
  BENCHMARK_MIN_PARCELS,
  BENCHMARK_MIN_STORES,
  type BenchmarkLine,
  type BenchmarkResponse,
} from '@trackecom/contracts';
import { type BenchmarkRow, byWilaya, toLine } from '../domain/benchmark.js';

export const BENCHMARK_ROWS = Symbol('BENCHMARK_ROWS');

export interface BenchmarkRows {
  rows(storeId: string, days: number): Promise<BenchmarkRow[]>;
}

/** "You vs the market" per wilaya and per carrier (#200). */
@Injectable()
export class BenchmarksService {
  constructor(@Inject(BENCHMARK_ROWS) private readonly source: BenchmarkRows) {}

  async benchmark(storeId: string, days: number): Promise<BenchmarkResponse> {
    const lines = (await this.source.rows(storeId, days))
      .map(toLine)
      .filter((line): line is BenchmarkLine => line !== null)
      .sort(byWilaya);
    return {
      days,
      minStores: BENCHMARK_MIN_STORES,
      minParcels: BENCHMARK_MIN_PARCELS,
      wilayas: lines.filter((line) => line.carrier === null),
      carriers: lines.filter((line) => line.carrier !== null),
    };
  }
}
