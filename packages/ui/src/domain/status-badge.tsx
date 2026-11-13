import { Badge, type BadgeProps, type BadgeVariant } from '../primitives/badge.js';

const statusTone: Readonly<Record<string, BadgeVariant>> = {
  new: 'info',
  to_confirm: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
  unreachable: 'warning',
  postponed: 'warning',
  ready_to_ship: 'info',
  shipped: 'info',
  in_transit: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  failed_attempt: 'danger',
  returning: 'warning',
  returned: 'neutral',
  pending: 'warning',
  created: 'info',
  exception: 'danger',
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  readonly status: string;
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  return <Badge variant={statusTone[status] ?? 'neutral'} data-status={status} {...props} />;
}
