import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalSettingsPage } from '../../../../../components/legal/legal-settings-page';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: 'legal' }))('title') };
}

export default async function Page({ params }: PageProps) {
  setRequestLocale((await params).locale);
  return <LegalSettingsPage />;
}
