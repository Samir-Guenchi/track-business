'use client';

import type { LiveSession } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { liveParam } from '../../lib/live/live-order';
import { localPhone } from '../../lib/orders/pasted-order';
import { cell, ClaimsTable } from '../claims/claims-table';

const COLUMNS = ['code', 'product', 'size', 'quantity', 'customer', 'order'] as const;

type Reservation = LiveSession['reservations'][number];

function OrderCell({
  session,
  item,
}: {
  readonly session: LiveSession;
  readonly item: Reservation;
}) {
  const t = useTranslations('live.session');
  if (item.orderId) {
    return (
      <Link href={`/orders/${item.orderId}`} className="text-tape underline">
        {t('openOrder')}
      </Link>
    );
  }
  const live = liveParam({ sessionId: session.id, reservationId: item.id });
  return (
    <Link href={`/orders/new?live=${live}`} className="font-medium text-tape underline">
      {t('createOrder')}
    </Link>
  );
}

/** Reservations in comment order; each becomes an order through the prefilled form. */
export function ReservationsTable({ session }: { readonly session: LiveSession }) {
  const t = useTranslations('live.session');
  const productName = (code: string) =>
    session.products.find((product) => product.code === code)?.name ?? code;
  return (
    <ClaimsTable
      label={t('reservations')}
      headers={COLUMNS.map((column) => t(`columns.${column}`))}
    >
      {session.reservations.map((item) => (
        <tr key={item.id} className="border-t border-border" title={item.comment}>
          <td className={cell} dir="ltr">
            {item.code}
          </td>
          <td className={cell}>{productName(item.code)}</td>
          <td className={cell}>{item.size ?? '-'}</td>
          <td className={cell}>{item.quantity}</td>
          <td className={cell}>
            {item.name && <span className="me-2">{item.name}</span>}
            <span dir="ltr">{localPhone(item.phone)}</span>
          </td>
          <td className={cell}>
            <OrderCell session={session} item={item} />
          </td>
        </tr>
      ))}
    </ClaimsTable>
  );
}
