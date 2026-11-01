import type { BestTime } from '@trackecom/contracts';
import {
  MIN_CUSTOMER_ATTEMPTS,
  MIN_GROUP_ATTEMPTS,
  type HourlyAttempts,
  bestTime,
} from '../domain/best-time.js';
import type { AnswerStatsQuery, ConfirmationRepository } from './ports/confirmation.repository.js';

/** How far back answer rates are learnt. */
const HISTORY_DAYS = 90;
const total = (rows: readonly HourlyAttempts[]) => rows.reduce((sum, row) => sum + row.attempts, 0);

export interface BestTimeTarget {
  readonly storeId: string;
  readonly phone: string;
  readonly wilayaCode: number;
}

/**
 * The best time to call this customer (#54): from their own calls when there are a few, else
 * from the store's calls to their wilaya, else from all the store's calls. Null without history.
 */
export async function lookUpBestTime(
  repository: ConfirmationRepository,
  target: BestTimeTarget,
  now: Date,
): Promise<BestTime | null> {
  const since = new Date(now.getTime() - HISTORY_DAYS * 86_400_000);
  const base: AnswerStatsQuery = { storeId: target.storeId, since };
  const customer = await repository.answerStats({ ...base, phone: target.phone });
  if (total(customer) >= MIN_CUSTOMER_ATTEMPTS) return bestTime(customer, 'customer', now);
  const wilaya = await repository.answerStats({ ...base, wilayaCode: target.wilayaCode });
  if (total(wilaya) >= MIN_GROUP_ATTEMPTS) return bestTime(wilaya, 'wilaya', now);
  const store = await repository.answerStats(base);
  return total(store) >= MIN_GROUP_ATTEMPTS ? bestTime(store, 'store', now) : null;
}
