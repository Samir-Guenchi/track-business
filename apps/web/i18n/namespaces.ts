/**
 * One message file per feature (docs/PARALLEL_PLAN.md rule 2).
 * A new feature adds its name here and `messages/{ar,fr,en}/<name>.json`.
 */
export const namespaces = [
  'common',
  'shell',
  'dashboard',
  'auth',
  'onboarding',
  'orders',
  'tracking',
  'followups',
  'returns',
  'orderForm',
  'deliveryChoices',
  'deliveryRequests',
  'stopDesks',
  'forms',
  'claims',
  'storeProfile',
  'legal',
] as const;

export type Namespace = (typeof namespaces)[number];
