import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ResellersPage } from '../../../../components/resellers/resellers-page';
import { studioFontClassName } from '../../../../lib/studio-fonts';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: 'resellers' }))('title') };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`studio ${studioFontClassName}`}>
      <ResellersPage />
    </div>
  );
}
