'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { CandidatesTab } from './candidates-tab';
import { ClaimsTab } from './claims-tab';
import { DisputedAttemptsTab } from './disputed-attempts-tab';
import { MarketTab } from './market-tab';
import { ScorecardTab } from './scorecard-tab';

const TABS = ['candidates', 'claims', 'scorecard', 'market', 'disputed'] as const;

/**
 * Claims against carriers (#139): parcels worth claiming, the claims and their letters, and the
 * scorecard that ranks carriers per wilaya.
 */
export function ClaimsPage() {
  const t = useTranslations('claims');
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <Tabs defaultValue="candidates">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="candidates">
          <CandidatesTab />
        </TabsContent>
        <TabsContent value="claims">
          <ClaimsTab />
        </TabsContent>
        <TabsContent value="scorecard">
          <ScorecardTab />
        </TabsContent>
        <TabsContent value="market">
          <MarketTab />
        </TabsContent>
        <TabsContent value="disputed">
          <DisputedAttemptsTab />
        </TabsContent>
      </Tabs>
    </section>
  );
}
