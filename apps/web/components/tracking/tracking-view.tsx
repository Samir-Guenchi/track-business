import type { Eta, PublicTrackingResponse } from '@trackecom/contracts';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n/routing';
import { formatCalendarDay } from '../../lib/format';
import { progressOf } from '../../lib/tracking/progress';
import { ProgressSteps } from './progress-steps';
import { TrackingTimeline } from './tracking-timeline';

const panel = 'flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 shadow-panel';

async function etaText(eta: Eta | null): Promise<string | null> {
  if (!eta) return null;
  const t = await getTranslations('tracking');
  const locale = (await getLocale()) as Locale;
  const earliest = formatCalendarDay(eta.earliest, locale);
  if (eta.earliest === eta.latest) return t('eta', { day: earliest });
  return t('etaRange', { earliest, latest: formatCalendarDay(eta.latest, locale) });
}

/** The customer's view of one parcel: where it is, when it comes, what happened. */
export async function TrackingView({ tracking }: { readonly tracking: PublicTrackingResponse }) {
  const t = await getTranslations('tracking');
  const { tone } = progressOf(tracking.status);
  const eta = tracking.status === 'delivered' ? null : await etaText(tracking.eta);
  return (
    <div className="flex flex-col gap-4">
      <section className={panel}>
        <h1 className="text-2xl font-semibold">{t(`headline.${tracking.status}`)}</h1>
        {eta && <p className="text-lg text-tape-dark">{eta}</p>}
        <ProgressSteps status={tracking.status} />
        {tone === 'attention' && <p className="text-sm">{t('attentionHelp')}</p>}
        {tone === 'stopped' && <p className="text-sm">{t('stoppedHelp')}</p>}
      </section>
      <section className={panel}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted">{t('carrier')}</dt>
          <dd className="text-end font-medium">{tracking.carrier}</dd>
          <dt className="text-muted">{t('trackingNumber')}</dt>
          <dd className="text-end font-medium" dir="ltr">
            {tracking.trackingNumber}
          </dd>
        </dl>
      </section>
      <section className={panel}>
        <h2 className="text-sm font-semibold text-muted">{t('history')}</h2>
        <TrackingTimeline events={tracking.events} />
      </section>
    </div>
  );
}
