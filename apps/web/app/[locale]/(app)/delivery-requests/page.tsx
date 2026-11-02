import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DeliveryRequestsPage } from '../../../../components/delivery-requests/delivery-requests-page';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return { title: (await getTranslations({ locale, namespace: 'deliveryRequests' }))('title') };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DeliveryRequestsPage />;
}
