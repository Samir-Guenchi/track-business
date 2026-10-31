import type { ParcelStatus } from './shipment.types.js';

/**
 * Builds a lookup from a carrier's status labels to ours. Labels are compared without case,
 * accents or extra spaces, because carriers are not consistent ("Livré", "livre", "LIVRÉ ").
 * Unknown labels return null so the caller keeps the raw text and logs it for mapping.
 */
export function statusMapper(table: Readonly<Record<string, ParcelStatus>>) {
  const normalise = (label: string) =>
    label
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const lookup = new Map(
    Object.entries(table).map(([label, status]) => [normalise(label), status]),
  );
  return (label: string): ParcelStatus | null => lookup.get(normalise(label)) ?? null;
}
