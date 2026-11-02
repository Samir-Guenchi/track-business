import { getTranslations } from 'next-intl/server';

export default async function TrackingNotFound() {
  const t = await getTranslations('tracking');
  return (
    <section className="flex flex-col gap-2 rounded-panel border border-border bg-surface p-5">
      <h1 className="text-xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="text-sm text-muted">{t('notFoundBody')}</p>
    </section>
  );
}
