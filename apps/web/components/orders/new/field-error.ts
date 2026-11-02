import type { DraftField } from '../../../lib/orders/draft-errors';

export interface DraftSectionProps {
  readonly errors: ReadonlySet<DraftField>;
}

/** Spread on an input: `{...fieldError(errors, 'name', t('errors.name'))}`. */
export function fieldError(
  errors: ReadonlySet<DraftField>,
  field: DraftField,
  message: string,
): { error?: string } {
  return errors.has(field) ? { error: message } : {};
}
