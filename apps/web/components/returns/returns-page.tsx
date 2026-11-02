'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { ExpectedReturns } from './expected-returns';
import { ReturnBatches } from './return-batches';
import { ReturnSummary } from './return-summary';

/** The return-to-seller chain (#133): what carriers owe back, and each hand-over received. */
export function ReturnsPage() {
  const t = useTranslations('returns');
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted">{t('subtitle')}</p>
        </div>
        <Link href="/returns/receive" className="tk-button" data-variant="primary" data-size="md">
          {t('receiveCta')}
        </Link>
      </header>
      <ReturnSummary />
      <Tabs defaultValue="expected" className="flex flex-col gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="expected">{t('tabs.expected')}</TabsTrigger>
          <TabsTrigger value="batches">{t('tabs.batches')}</TabsTrigger>
        </TabsList>
        <TabsContent value="expected">
          <ExpectedReturns />
        </TabsContent>
        <TabsContent value="batches">
          <ReturnBatches />
        </TabsContent>
      </Tabs>
    </section>
  );
}
