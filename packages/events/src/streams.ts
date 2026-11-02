/** One stream per producing service: `events:orders`, `events:shipping`... */
export const streamFor = (eventType: string): string =>
  `events:${eventType.split('.')[0] ?? 'unknown'}`;

/** Where messages go after too many failed deliveries; inspected and replayed by hand. */
export const DEAD_LETTER_STREAM = 'events:dead-letter';

/** Rough cap per stream; consumers that fall further behind than this lose the oldest events. */
export const STREAM_MAX_LENGTH = 100_000;
