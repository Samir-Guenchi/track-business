import { CarrierError } from './carrier.errors.js';

export interface RetryOptions {
  readonly attempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  /** Injected so tests do not wait. */
  readonly sleep: (ms: number) => Promise<void>;
  readonly random: () => number;
}

export const DEFAULT_RETRY: RetryOptions = {
  attempts: 4,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
};

/** Exponential backoff with full jitter, honouring the carrier's Retry-After when it sends one. */
export function backoffDelay(attempt: number, error: CarrierError, options: RetryOptions): number {
  const ceiling = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** attempt);
  const jittered = Math.round(ceiling * options.random());
  return Math.max(jittered, error.details.retryAfterMs ?? 0);
}

/** Retries retryable CarrierErrors only; anything else is thrown at once. */
export async function withRetry<T>(
  call: (attempt: number) => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await call(attempt);
    } catch (error) {
      const last = attempt + 1 >= options.attempts;
      if (!(error instanceof CarrierError) || !error.retryable || last) throw error;
      await options.sleep(backoffDelay(attempt, error, options));
    }
  }
}
