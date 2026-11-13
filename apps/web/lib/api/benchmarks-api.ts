import { BenchmarkResponseSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Own delivery figures next to the anonymous market (#200), served by the shipping service. */
export const benchmarksApi = {
  get: (days: number) =>
    apiRequest({ path: `/benchmarks?days=${days}`, schema: BenchmarkResponseSchema }),
};
