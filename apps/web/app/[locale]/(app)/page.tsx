import { EmptyState, MoneyDZD } from '@trackecom/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '../../../i18n/routing';

interface DashboardPageProps {
  readonly params: Promise<{ locale: string }>;
}

// TODO(#36): replace the placeholder with the real seller dashboard.
export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const uiLocale = isLocale(locale) ? locale : 'fr';
  setRequestLocale(uiLocale);
  const t = await getTranslations('dashboard');
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <div className="rounded-panel border border-border bg-surface p-5 shadow-panel">
        <p className="text-sm text-muted">{t('codPending')}</p>
        <MoneyDZD amount={0} locale={uiLocale} className="text-2xl font-semibold" />
      </div>
      <EmptyState title={t('today')} description={t('intro')} />
    </section>
  );
}
