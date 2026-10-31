import type { AuditChange } from '@trackecom/contracts';

export const REDACTED = '[redacted]';

/** Never stored in an audit trail, even as "before/after" (secure-coding skill). */
const SECRET_FIELDS = /password|secret|token|otp|apikey|api_key|hash/i;
const PHONE_FIELDS = /phone|mobile/i;

type Snapshot = Readonly<Record<string, unknown>>;

/** `+213551234567` -> `+213****4567`; enough to recognise a change without storing the number. */
export function maskPhone(value: unknown): unknown {
  if (typeof value !== 'string' || value.length < 8) return value === undefined ? value : REDACTED;
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

function protect(field: string, value: unknown): unknown {
  if (SECRET_FIELDS.test(field)) return value === undefined ? undefined : REDACTED;
  if (PHONE_FIELDS.test(field)) return maskPhone(value);
  return value;
}

const isEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Field-level diff of two snapshots of the same record. Only changed fields are kept, so an
 * audit row stays small and shows exactly what an agent edited.
 */
export function computeChanges(before: Snapshot | null, after: Snapshot | null): AuditChange[] {
  const fields = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...fields]
    .filter((field) => !isEqual(before?.[field], after?.[field]))
    .sort()
    .map((field) => ({
      field,
      before: protect(field, before?.[field]) ?? null,
      after: protect(field, after?.[field]) ?? null,
    }));
}
