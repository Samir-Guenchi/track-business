'use client';

import type { CreateReturnRequest, PublicReturnStatus } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '../../../i18n/navigation';
import type { Locale } from '../../../i18n/routing';
import { formatDateTime } from '../../../lib/format';
import { fetchReturnStatus, sendReturnRequest } from '../../../lib/tracking/return-request-api';
import { ReturnRequestForm } from './return-request-form';

type Request = NonNullable<PublicReturnStatus['request']>;

const panel = 'flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 shadow-panel';

function RequestStatus({ request }: { readonly request: Request }) {
  const t = useTranslations('returnRequest');
  return (
    <div role="status" className="flex flex-col gap-2 text-sm">
      <p className="font-medium">{t(`state.${request.state}`)}</p>
      {request.sellerMessage && <p className="text-muted">{request.sellerMessage}</p>}
      {request.newTrackingCode && (
        <Link href={`/t/${request.newTrackingCode}`} className="text-tape underline">
          {t('followNew')}
        </Link>
      )}
    </div>
  );
}

/**
 * "Return or exchange" after delivery (#201): the request goes to the seller's queue instead of
 * calls to their personal number, and the decision shows up here.
 */
export function ReturnRequestPanel({ code }: { readonly code: string }) {
  const t = useTranslations('returnRequest');
  const locale = useLocale() as Locale;
  const [status, setStatus] = useState<PublicReturnStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetchReturnStatus(code).then(setStatus, () => setStatus(null));
  }, [code]);
  if (!status || (!status.canRequest && !status.request)) return null;
  const send = async (body: CreateReturnRequest) => {
    setSending(true);
    const saved = await sendReturnRequest(code, body);
    setSending(false);
    setFailed(saved === null);
    if (saved) setStatus(saved);
  };
  return (
    <section className={panel} aria-labelledby="return-request-title">
      <h2 id="return-request-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      {status.canRequest && status.deadline && (
        <p className="text-sm text-muted">
          {t('until', { date: formatDateTime(new Date(status.deadline), locale) })}
        </p>
      )}
      {status.canRequest && <ReturnRequestForm sending={sending} onSend={send} />}
      {status.request && <RequestStatus request={status.request} />}
      {failed && <p className="text-sm text-stamp">{t('error')}</p>}
    </section>
  );
}
