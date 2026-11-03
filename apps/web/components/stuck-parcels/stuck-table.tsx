'use client';

import type { StuckParcel } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { stuckLevel } from '../../lib/stuck-parcels/stuck-view';
import { cell, ClaimsTable } from '../claims/claims-table';

const COLUMNS = ['parcel', 'carrier', 'wilaya', 'status', 'lastMove', 'idle'] as const;

interface Props {
  readonly items: readonly StuckParcel[];
  readonly wilayaName: (code: number | null) => string;
}

/** The stuck parcels, oldest first, each linking to its order. */
export function StuckTable({ items, wilayaName }: Props) {
  const t = useTranslations('stuckParcels');
  return (
    <ClaimsTable label={t('listLabel')} headers={COLUMNS.map((column) => t(`columns.${column}`))}>
      {items.map((parcel) => (
        <StuckRow
          key={parcel.shipmentId}
          parcel={parcel}
          wilaya={wilayaName(parcel.toWilayaCode)}
        />
      ))}
    </ClaimsTable>
  );
}

function StuckRow({ parcel, wilaya }: { readonly parcel: StuckParcel; readonly wilaya: string }) {
  const t = useTranslations('stuckParcels');
  const format = useFormatter();
  const level = stuckLevel(parcel);
  return (
    <tr className="border-t border-border">
      <td className={cell}>
        <Link
          href={`/orders/${parcel.orderId}`}
          className="font-medium text-tape underline"
          dir="ltr"
        >
          {parcel.trackingNumber}
        </Link>
      </td>
      <td className={cell} dir="ltr">
        {parcel.carrier}
      </td>
      <td className={cell}>{wilaya}</td>
      <td className={cell}>{t(`status.${parcel.status}`)}</td>
      <td className={cell}>
        {format.dateTime(new Date(parcel.lastMoveAt), { dateStyle: 'medium' })}
      </td>
      <td className={cell}>
        <Badge variant={level === 'late' ? 'danger' : 'warning'}>
          {t('idleDays', { count: parcel.idleDays })}
        </Badge>
      </td>
    </tr>
  );
}
