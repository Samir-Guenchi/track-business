'use client';

import { EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { formatDateTime } from '../../lib/format';
import { useLiveSessions } from '../../lib/live/live-queries';
import { NewSessionForm } from './new-session-form';

/** Live selling (#199): start a live, then turn its comments into orders. */
export function LiveSessionsPage() {
  const t = useTranslations('live');
  const locale = useLocale() as Locale;
  const sessions = useLiveSessions();
  const items = sessions.data?.items ?? [];
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <NewSessionForm />
      {sessions.isPending && <Skeleton className="h-24" />}
      {sessions.isSuccess && items.length === 0 && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      <ul className="flex flex-col divide-y divide-border" aria-label={t('listLabel')}>
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <Link href={`/live/${item.id}`} className="font-medium text-tape underline">
              {item.title}
            </Link>
            <span className="text-sm text-muted">
              {formatDateTime(new Date(item.createdAt), locale)} ·{' '}
              {t('counts', { reservations: item.reservations, ordered: item.ordered })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
