import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LiveSessionPage } from '../../../../../components/live/live-session-page';

interface PageProps {
  readonly params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: 'live' }))('title') };
}

export default async function Page({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <LiveSessionPage id={id} />;
}
