import { createHash } from 'node:crypto';

/**
 * Identity of a carrier event: the same scan received by webhook and by polling, or replayed,
 * gets the same key, so the unique index stores it once and nothing is emitted twice.
 */
export function eventKey(event: {
  carrierStatus: string;
  at: Date;
  location: string | null;
}): string {
  const source = [event.carrierStatus.trim(), event.at.toISOString(), event.location?.trim() ?? ''];
  return createHash('sha256').update(source.join('\u001f')).digest('base64url').slice(0, 32);
}
