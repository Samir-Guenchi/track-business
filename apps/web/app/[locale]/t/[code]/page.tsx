import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { AttemptCheckPanel } from '../../../../components/tracking/attempt-check';
import { DeliveryChoicesPanel } from '../../../../components/tracking/choices/delivery-choices';
import { TrackingView } from '../../../../components/tracking/tracking-view';
import { fetchPublicTracking } from '../../../../lib/tracking/public-tracking';

interface PageProps {
  readonly params: Promise<{ locale: string; code: string }>;
}

/** Metadata and page share one request per render. */
const trackingFor = cache(fetchPublicTracking);

/** WhatsApp and Messenger show this title and line when the link is shared. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: 'tracking' });
  const tracking = await trackingFor(code);
  const title = tracking ? `${t(`headline.${tracking.status}`)} · ${t('title')}` : t('title');
  return {
    title,
    description: t('shareDescription'),
    robots: { index: false, follow: false },
    openGraph: { title, description: t('shareDescription'), type: 'website', locale },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const tracking = await trackingFor(code);
  if (!tracking) notFound();
  return (
    <div className="flex flex-col gap-4">
      <TrackingView tracking={tracking} />
      <AttemptCheckPanel code={code} />
      <DeliveryChoicesPanel code={code} />
    </div>
  );
}
