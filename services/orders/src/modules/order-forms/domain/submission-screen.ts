import { FORM_LIMITS } from '@trackecom/contracts';

export type SubmissionOutcome = 'created' | 'duplicate' | 'rate_limited' | 'spam';
export type Refusal = Exclude<SubmissionOutcome, 'created'>;

/** What the store already saw from this caller and this phone. */
export interface SubmissionHistory {
  readonly attemptsFromIp: number;
  readonly ordersFromPhone: number;
  readonly sameProductRecently: boolean;
}

/**
 * Anti-spam (#134), cheapest signal first: a filled honeypot is a bot, then rate limits per
 * address and per phone, then the same phone ordering the same product again within 24 h.
 */
export function screenSubmission(
  honeypot: string | undefined,
  history: SubmissionHistory,
): Refusal | null {
  if (honeypot?.trim()) return 'spam';
  if (history.attemptsFromIp >= FORM_LIMITS.perIpPerHour) return 'rate_limited';
  if (history.ordersFromPhone >= FORM_LIMITS.perPhonePerHour) return 'rate_limited';
  if (history.sameProductRecently) return 'duplicate';
  return null;
}
