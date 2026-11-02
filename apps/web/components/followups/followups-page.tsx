'use client';

import { Button, EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { FormAlert } from '../auth/form-alert';
import { FollowupCard } from './followup-card';
import { FollowupMetrics } from './followup-metrics';
import { FollowupsToolbar } from './followups-toolbar';
import { useFollowupsPage } from './use-followups-page';

/** The failed-delivery queue (#132): most urgent first, one decision per parcel. */
export function FollowupsPage() {
  const t = useTranslations('followups');
  const page = useFollowupsPage();
  const { list, items } = page;
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>
      <FollowupsToolbar filters={page.filters} onChange={page.setFilters} />
      <FormAlert tone="success" message={page.saved} />
      <FormAlert message={page.error} />
      {list.isPending && <Skeleton className="h-48" />}
      {list.isSuccess && items.length === 0 && (
        <EmptyState title={t('title')} description={t('empty')} />
      )}
      <ul className="flex flex-col gap-3" aria-label={t('listLabel')}>
        {items.map((item) => (
          <FollowupCard
            key={item.id}
            item={item}
            wilayaName={page.wilayaName(item.wilayaCode)}
            pending={page.pendingId === item.id}
            onDecide={page.onDecide}
          />
        ))}
      </ul>
      <MoreButton list={list} label={t('more')} />
      <FollowupMetrics />
    </section>
  );
}

interface MoreButtonProps {
  readonly list: ReturnType<typeof useFollowupsPage>['list'];
  readonly label: string;
}

function MoreButton({ list, label }: MoreButtonProps) {
  if (!list.hasNextPage) return null;
  return (
    <Button
      variant="secondary"
      className="self-start"
      loading={list.isFetchingNextPage}
      onClick={() => void list.fetchNextPage()}
    >
      {label}
    </Button>
  );
}
