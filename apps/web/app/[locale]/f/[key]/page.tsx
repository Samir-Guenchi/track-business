import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { CodFormView } from '../../../../components/order-form/cod-form';
import { fetchPublicForm, fetchWilayas } from '../../../../lib/forms/public-form';

interface PageProps {
  readonly params: Promise<{ locale: string; key: string }>;
}

const formFor = cache(fetchPublicForm);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, key } = await params;
  const form = await formFor(key);
  const t = await getTranslations({ locale, namespace: 'orderForm' });
  return { title: form?.title ?? t('notFound.title'), robots: { index: false, follow: false } };
}

export default async function Page({ params }: PageProps) {
  const { locale, key } = await params;
  setRequestLocale(locale);
  const [form, wilayas] = await Promise.all([formFor(key), fetchWilayas()]);
  if (!form) notFound();
  return <CodFormView form={form} wilayas={wilayas} />;
}
