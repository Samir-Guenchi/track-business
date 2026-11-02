import type { PublicTrackingResponse } from '@trackecom/contracts';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n/routing';
import { formatDateTime } from '../../lib/format';

type TrackingEvents = PublicTrackingResponse['events'];

/** Newest first, as the API sends it. */
export async function TrackingTimeline({ events }: { readonly events: TrackingEvents }) {
  const t = await getTranslations('tracking');
  const locale = (await getLocale()) as Locale;
  if (events.length === 0) return <p className="text-sm text-muted">{t('noEvents')}</p>;
  return (
    <ol className="flex flex-col gap-3 border-s-2 border-border ps-4">
      {events.map((event) => (
        <li key={`${event.at}-${event.status}`} className="flex flex-col">
          <span className="font-medium">{t(`headline.${event.status}`)}</span>
          <span className="text-sm text-muted">
            <time dateTime={event.at}>{formatDateTime(new Date(event.at), locale)}</time>
            {event.location && <> · {event.location}</>}
          </span>
        </li>
      ))}
    </ol>
  );
}
