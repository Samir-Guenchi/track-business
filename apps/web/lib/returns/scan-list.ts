import type { ReturnCondition } from '@trackecom/contracts';

export interface ScanRow {
  readonly trackingNumber: string;
  readonly condition: ReturnCondition;
}

const clean = (raw: string) => raw.trim().replace(/\s+/g, '');

/**
 * Adds what the scanner (or the keyboard) typed. A number already in the list is moved to the
 * top instead of being added twice, so a double scan is visible but harmless.
 */
export function addScan(rows: readonly ScanRow[], raw: string): ScanRow[] {
  const trackingNumber = clean(raw);
  if (trackingNumber.length < 3) return [...rows];
  const existing = rows.find((row) => row.trackingNumber === trackingNumber);
  const rest = rows.filter((row) => row.trackingNumber !== trackingNumber);
  return [existing ?? { trackingNumber, condition: 'intact' }, ...rest];
}

/** The courier's own list, pasted one number per line (commas and spaces also split). */
export function parseDeclared(text: string): string[] {
  const numbers = text.split(/[\n,;\s]+/).map(clean);
  return [...new Set(numbers.filter((number) => number.length >= 3))];
}
