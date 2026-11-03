'use client';

import type { AttemptAnswer, PublicAttemptCheck } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { answerAttemptCheck, fetchAttemptCheck } from '../../lib/tracking/attempt-check-api';

type Check = NonNullable<PublicAttemptCheck['check']>;

const panel = 'flex flex-col gap-3 rounded-panel border border-stamp bg-surface p-5 shadow-panel';

function Question(props: { check: Check; sending: boolean; onAnswer: (a: AttemptAnswer) => void }) {
  const t = useTranslations('attemptCheck');
  return (
    <>
      <p className="text-sm">{t('question', { reason: t(`reason.${props.check.reason}`) })}</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={props.sending} onClick={() => props.onAnswer('not_contacted')}>
          {t('notContacted')}
        </Button>
        <Button
          variant="secondary"
          disabled={props.sending}
          onClick={() => props.onAnswer('contacted')}
        >
          {t('contacted')}
        </Button>
      </div>
    </>
  );
}

/**
 * "Did the courier really call or come?" (#195). A "no" tells the seller the attempt is
 * disputed so they can push the carrier for a new delivery instead of paying a return.
 */
export function AttemptCheckPanel({ code }: { readonly code: string }) {
  const t = useTranslations('attemptCheck');
  const [check, setCheck] = useState<Check | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetchAttemptCheck(code).then(setCheck, () => setCheck(null));
  }, [code]);
  if (!check) return null;
  const answer = async (value: AttemptAnswer) => {
    setSending(true);
    const saved = await answerAttemptCheck(code, { eventId: check.eventId, answer: value });
    setSending(false);
    setFailed(saved === null);
    if (saved) setCheck(saved);
  };
  return (
    <section className={panel} aria-labelledby="attempt-check-title">
      <h2 id="attempt-check-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      {check.answer === null && <Question check={check} sending={sending} onAnswer={answer} />}
      {check.answer && (
        <p role="status" className="text-sm text-tape-dark">
          {t(`thanks.${check.answer}`)}
        </p>
      )}
      {failed && <p className="text-sm text-stamp">{t('error')}</p>}
    </section>
  );
}
