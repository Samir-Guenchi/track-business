'use client';

import type { ReturnBatch } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';

/** Received parcels, then each kind of mismatch, so a claim can quote the manifest as is. */
export function ManifestSections({ batch }: { readonly batch: ReturnBatch }) {
  const t = useTranslations('returns');
  return (
    <>
      <ReceivedTable batch={batch} />
      <NumberList
        title={t('manifest.missing', { count: batch.missing.length })}
        numbers={batch.missing}
        alert
      />
      <NumberList
        title={t('manifest.unknown', { count: batch.unknown.length })}
        numbers={batch.unknown}
      />
      <NumberList
        title={t('manifest.alreadyReceived', { count: batch.alreadyReceived.length })}
        numbers={batch.alreadyReceived}
      />
    </>
  );
}

interface NumberListProps {
  readonly title: string;
  readonly numbers: readonly string[];
  readonly alert?: boolean;
}

function NumberList({ title, numbers, alert = false }: NumberListProps) {
  if (numbers.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className={alert ? 'font-semibold text-stamp' : 'font-semibold'}>{title}</h2>
      <p className="text-sm" dir="ltr">
        {numbers.join(' · ')}
      </p>
    </section>
  );
}

function ReceivedTable({ batch }: { readonly batch: ReturnBatch }) {
  const t = useTranslations('returns');
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold">{t('manifest.received', { count: batch.received.length })}</h2>
      <table className="w-full text-sm">
        <thead className="text-muted">
          <tr>
            <th className="py-1 text-start font-medium">{t('columns.tracking')}</th>
            <th className="py-1 text-start font-medium">{t('manifest.order')}</th>
            <th className="py-1 text-start font-medium">{t('manifest.condition')}</th>
          </tr>
        </thead>
        <tbody>
          {batch.received.map((item) => (
            <ReceivedRow key={item.shipmentId} item={item} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReceivedRow({ item }: { readonly item: ReturnBatch['received'][number] }) {
  const t = useTranslations('returns');
  return (
    <tr className="border-t border-border">
      <td className="py-1 font-medium" dir="ltr">
        {item.trackingNumber}
      </td>
      <td className="py-1">
        <Link href={`/orders/${item.orderId}`} className="text-tape underline print:no-underline">
          {item.orderId.slice(0, 8)}
        </Link>
      </td>
      <td className="py-1">
        {t(`condition.${item.condition}`)}{' '}
        {item.unannounced && <Badge variant="warning">{t('manifest.unannounced')}</Badge>}
      </td>
    </tr>
  );
}
