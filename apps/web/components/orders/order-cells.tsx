import type { Order } from '@trackecom/contracts';
import { StatusBadge } from '@trackecom/ui';
import { ShieldAlert } from 'lucide-react';
import { Link } from '../../i18n/navigation';

export function RefCell({ order }: { readonly order: Order }) {
  return (
    <Link href={`/orders/${order.id}`} className="font-medium text-tape underline" dir="ltr">
      {order.ref}
    </Link>
  );
}

export function CustomerCell({ order }: { readonly order: Order }) {
  return (
    <span className="flex flex-col">
      <span>{order.customer.name}</span>
      <span className="text-xs text-muted" dir="ltr">
        {order.customer.phone}
      </span>
    </span>
  );
}

interface StatusCellProps {
  readonly order: Order;
  readonly label: string;
  readonly riskLabel: string;
}

export function StatusCell({ order, label, riskLabel }: StatusCellProps) {
  return (
    <span className="flex items-center gap-1">
      <StatusBadge status={order.status}>{label}</StatusBadge>
      {order.riskFlags.length > 0 && (
        <ShieldAlert size={16} className="text-stamp" role="img" aria-label={riskLabel} />
      )}
    </span>
  );
}
