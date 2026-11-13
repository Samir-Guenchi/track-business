import { useQuery } from '@tanstack/react-query';
import type { BenchmarkLine } from '@trackecom/contracts';
import { benchmarksApi } from '../api/benchmarks-api';

export const useBenchmarks = (days: number) =>
  useQuery({ queryKey: ['benchmarks', days], queryFn: () => benchmarksApi.get(days) });

export type Verdict = 'below' | 'close' | 'above';

/** Ten points of delivery rate: below that the gap is noise, above it the seller should act. */
const MEANINGFUL_GAP = 0.1;

/** Is the store doing worse than the market here? Null when either side has no rate. */
export function verdict(line: Pick<BenchmarkLine, 'own' | 'market'>): Verdict | null {
  const own = line.own?.deliveryRate;
  const market = line.market?.deliveryRate;
  if (own === undefined || own === null || market === undefined || market === null) return null;
  const gap = own - market;
  if (gap <= -MEANINGFUL_GAP) return 'below';
  return gap >= MEANINGFUL_GAP ? 'above' : 'close';
}
