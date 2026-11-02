'use client';

import { Button, EmptyState, Skeleton } from '@trackecom/ui';
import { Printer } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { formatDateTime } from '../../lib/format';
import { useReturnBatch } from '../../lib/returns/returns-queries';
import { ManifestSections } from './manifest-sections';

/**
 * The return manifest (#133): what the courier handed over, what was missing, and two signature
 * boxes. Printed on paper so the courier and the seller both sign the same list.
 */
export function ReturnManifest({ id }: { readonly id: string }) {
  const t = useTranslations('returns.manifest');
  const locale = useLocale() as Locale;
  const query = useReturnBatch(id);
  if (query.isPending) return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  if (!query.data) return <EmptyState title={t('title')} description={t('notFound')} />;
  const batch = query.data;
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-5 rounded-panel border border-border bg-surface p-6 shadow-panel print:border-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
            <dt className="text-muted">{t('date')}</dt>
            <dd>{formatDateTime(new Date(batch.createdAt), locale)}</dd>
            <dt className="text-muted">{t('carrier')}</dt>
            <dd dir="ltr" className="text-start">
              {batch.carrier}
            </dd>
            <dt className="text-muted">{t('courier')}</dt>
            <dd>{batch.courierName ?? '-'}</dd>
          </dl>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href="/returns" className="tk-button" data-variant="ghost" data-size="md">
            {t('back')}
          </Link>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            {t('print')}
          </Button>
        </div>
      </header>
      <ManifestSections batch={batch} />
      {batch.note && <p className="text-sm">{batch.note}</p>}
      <SignatureBoxes />
    </article>
  );
}

function SignatureBoxes() {
  const t = useTranslations('returns.manifest');
  return (
    <footer className="grid grid-cols-2 gap-6 pt-6">
      {(['signCourier', 'signSeller'] as const).map((key) => (
        <div key={key} className="flex h-28 flex-col justify-end border-b border-ink">
          <span className="pb-1 text-sm text-muted">{t(key)}</span>
        </div>
      ))}
    </footer>
  );
}
