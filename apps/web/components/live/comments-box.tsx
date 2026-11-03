'use client';

import type { AddLiveCommentsResponse } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAddLiveComments } from '../../lib/live/live-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

function ReadResult({ result }: { readonly result: AddLiveCommentsResponse }) {
  const t = useTranslations('live.session');
  return (
    <div role="status" className="flex flex-col gap-1 text-sm">
      <p>{t('readResult', { added: result.added, duplicates: result.duplicates })}</p>
      {result.unread.length > 0 && (
        <>
          <p className="font-medium">{t('unread')}</p>
          <ul className="list-inside list-disc text-muted">
            {result.unread.map((comment, index) => (
              <li key={index}>{comment}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Paste comments copied from TikTok or Facebook; each line is read into a reservation. */
export function CommentsBox({ sessionId }: { readonly sessionId: string }) {
  const t = useTranslations('live.session');
  const add = useAddLiveComments(sessionId);
  const errorMessage = useErrorMessage();
  const [text, setText] = useState('');
  const read = () => add.mutate(text, { onSuccess: () => setText('') });
  return (
    <section className="flex flex-col gap-2 rounded-panel border border-border bg-surface p-4 shadow-panel">
      <label htmlFor="live-comments" className="font-medium">
        {t('commentsLabel')}
      </label>
      <textarea
        id="live-comments"
        rows={6}
        value={text}
        maxLength={50_000}
        placeholder={t('commentsPlaceholder')}
        className="rounded-control border border-border bg-surface p-2 text-sm"
        onChange={(event) => setText(event.currentTarget.value)}
      />
      <Button onClick={read} disabled={add.isPending || text.trim() === ''}>
        {t('read')}
      </Button>
      <FormAlert message={add.isError ? errorMessage(add.error) : null} />
      {add.data && <ReadResult result={add.data} />}
    </section>
  );
}
