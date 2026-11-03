import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PortalView } from '../../../../components/reseller-portal/portal-view';
import { fetchWilayas } from '../../../../lib/forms/public-form';
import { fetchPortal } from '../../../../lib/resellers/portal-api';

interface PageProps {
  readonly params: Promise<{ locale: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'resellerPortal' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function Page({ params }: PageProps) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const [portal, wilayas] = await Promise.all([fetchPortal(code), fetchWilayas()]);
  if (!portal) notFound();
  return <PortalView code={code} portal={portal} wilayas={wilayas} />;
}
