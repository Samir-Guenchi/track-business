'use client';

import { EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useLiveSession } from '../../lib/live/live-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { CommentsBox } from './comments-box';
import { ReservationsTable } from './reservations-table';

/** One live: the codes to show on screen, the comments box and the reservations. */
export function LiveSessionPage({ id }: { readonly id: string }) {
  const t = useTranslations('live.session');
  const session = useLiveSession(id);
  const errorMessage = useErrorMessage();
  if (session.isPending) return <Skeleton className="h-48" />;
  if (!session.data) return <FormAlert message={errorMessage(session.error)} />;
  const data = session.data;
  const ordered = data.reservations.filter((item) => item.orderId).length;
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <ul className="flex flex-wrap gap-2 text-sm" aria-label={t('codes')}>
          {data.products.map((product) => (
            <li key={product.code} className="rounded-control border border-border px-2 py-1">
              <span className="font-semibold" dir="ltr">
                {product.code}
              </span>{' '}
              {product.name}
            </li>
          ))}
        </ul>
      </header>
      <CommentsBox sessionId={id} />
      <p className="text-sm text-muted">
        {t('summary', { reservations: data.reservations.length, ordered })}
      </p>
      {data.reservations.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <ReservationsTable session={data} />
      )}
    </section>
  );
}
