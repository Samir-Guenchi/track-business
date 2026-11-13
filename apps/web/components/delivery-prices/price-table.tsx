'use client';

import type { DeliveryType, Wilaya } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import { wilayaLabel } from '../../lib/geo/geo-queries';
import type { PriceRow } from '../../lib/pricing/price-grid';
import type { PriceGridState } from './use-price-grid';

const digitsOnly = (text: string) => text.replace(/\D/g, '').slice(0, 6);

function PriceCell(props: {
  grid: PriceGridState;
  row: PriceRow;
  type: DeliveryType;
  label: string;
}) {
  const { grid, row, type } = props;
  return (
    <td className="px-1 py-1">
      <input
        inputMode="numeric"
        aria-label={props.label}
        className="tk-input h-9 w-full min-w-16 text-end"
        value={row[type]}
        placeholder="-"
        onChange={(event) =>
          grid.patchRow(row.wilayaCode, { [type]: digitsOnly(event.currentTarget.value) })
        }
      />
    </td>
  );
}

function ExcludedCell({
  grid,
  row,
  label,
}: {
  grid: PriceGridState;
  row: PriceRow;
  label: string;
}) {
  return (
    <td className="px-1 text-center">
      <input
        type="checkbox"
        aria-label={label}
        checked={row.excluded}
        onChange={(event) =>
          grid.patchRow(row.wilayaCode, { excluded: event.currentTarget.checked })
        }
      />
    </td>
  );
}

function PriceTableRow({ grid, row, name }: { grid: PriceGridState; row: PriceRow; name: string }) {
  const t = useTranslations('deliveryPrices');
  return (
    <tr className="border-t border-border">
      <th scope="row" className="py-1 text-start font-normal">
        {name}
      </th>
      <PriceCell grid={grid} row={row} type="home" label={`${name} · ${t('home')}`} />
      <PriceCell grid={grid} row={row} type="stopdesk" label={`${name} · ${t('stopdesk')}`} />
      <ExcludedCell grid={grid} row={row} label={`${name} · ${t('excluded')}`} />
    </tr>
  );
}

function TableHead() {
  const t = useTranslations('deliveryPrices');
  return (
    <thead className="text-muted">
      <tr>
        <th className="py-2 text-start font-medium">{t('wilaya')}</th>
        <th className="px-1 font-medium">{t('home')}</th>
        <th className="px-1 font-medium">{t('stopdesk')}</th>
        <th className="px-1 font-medium">{t('excluded')}</th>
      </tr>
    </thead>
  );
}

/** One row per wilaya: home price, stop-desk price, and "no free delivery here". */
export function PriceTable(props: {
  grid: PriceGridState;
  wilayas: readonly Wilaya[];
  filter: string;
}) {
  const locale = useLocale();
  const names = new Map(props.wilayas.map((wilaya) => [wilaya.code, wilayaLabel(wilaya, locale)]));
  const needle = props.filter.trim().toLowerCase();
  const rows = props.grid.draft.rows
    .map((row) => ({ row, name: names.get(row.wilayaCode) ?? String(row.wilayaCode) }))
    .filter(({ name }) => !needle || name.toLowerCase().includes(needle));
  return (
    <table className="w-full text-sm">
      <TableHead />
      <tbody>
        {rows.map(({ row, name }) => (
          <PriceTableRow key={row.wilayaCode} grid={props.grid} row={row} name={name} />
        ))}
      </tbody>
    </table>
  );
}
