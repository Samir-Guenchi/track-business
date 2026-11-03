import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { NewOrderForm } from '../../../../../components/orders/new/new-order-form';
import { parseLiveParam } from '../../../../../lib/live/live-order';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
  readonly searchParams?: Promise<{ live?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: 'orders.new' }))('title') };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const live = parseLiveParam((await searchParams)?.live);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'orders.new' });
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <NewOrderForm live={live} />
    </section>
  );
}
