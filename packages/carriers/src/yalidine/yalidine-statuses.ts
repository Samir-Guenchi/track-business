import type { FailedAttemptReason } from '@trackecom/contracts';
import { statusMapper } from '../status-map.js';

/** Yalidine status labels (French) onto our parcel statuses. Unknown labels return null. */
export const yalidineStatus = statusMapper({
  'En préparation': 'created',
  'Pas encore expédié': 'created',
  'A vérifier': 'created',
  'Pas encore ramassé': 'created',
  Ramassé: 'picked_up',
  Expédié: 'picked_up',
  Centre: 'in_transit',
  'Vers Wilaya': 'in_transit',
  'Reçu à Wilaya': 'in_transit',
  'Transfert reçu': 'in_transit',
  'En attente du client': 'out_for_delivery',
  'Sorti en livraison': 'out_for_delivery',
  'En alerte': 'failed_attempt',
  'Tentative échouée': 'failed_attempt',
  'Echèc livraison': 'failed_attempt',
  Livré: 'delivered',
  'Retour vers centre': 'returning',
  'Retourné au centre': 'returning',
  'Retour transfert': 'returning',
  'Retour groupé': 'returning',
  'Retour à retirer': 'returning',
  'Retour vers vendeur': 'returning',
  'Retourné au vendeur': 'returned',
  'Echange échoué': 'returning',
});

const REASONS: readonly [RegExp, FailedAttemptReason][] = [
  [/absent|introuvable/i, 'absent'],
  [/refus|annul/i, 'refused'],
  [/adresse|erron|incorrect/i, 'wrong_address'],
  [/[ée]teint|hors service|injoignable/i, 'phone_off'],
  [/ne r[ée]pond pas|pas de r[ée]ponse/i, 'no_answer'],
  [/report|reprogramm|plus tard/i, 'postponed_by_customer'],
];

/** Free-text failure reasons onto our list; anything else is `other`. */
export function yalidineFailureReason(reason: string | null): FailedAttemptReason | null {
  if (!reason) return null;
  return REASONS.find(([pattern]) => pattern.test(reason))?.[1] ?? 'other';
}
