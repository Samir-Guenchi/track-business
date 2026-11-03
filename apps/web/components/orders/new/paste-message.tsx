'use client';

import { useMutation } from '@tanstack/react-query';
import type { ParseOrderTextResponse } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ordersApi } from '../../../lib/api/orders-api';
import { filledFields, withPastedOrder } from '../../../lib/orders/pasted-order';
import type { DraftControls } from './use-order-draft';

const MAX_TEXT = 1000;

function PasteResult({ parsed }: { readonly parsed: ParseOrderTextResponse }) {
  const t = useTranslations('smartPaste');
  const fields = filledFields(parsed);
  if (fields.length === 0) return <p className="text-sm text-muted">{t('nothing')}</p>;
  const guessed = parsed.placeScore !== null && parsed.placeScore < 1;
  return (
    <p role="status" className="text-sm">
      {t('filled', { fields: fields.map((field) => t(`field.${field}`)).join(', ') })}
      {guessed && <span className="block text-stamp">{t('placeGuessed')}</span>}
    </p>
  );
}

function MessageBox(props: { readonly text: string; readonly onChange: (text: string) => void }) {
  const t = useTranslations('smartPaste');
  return (
    <label className="tk-field">
      <span className="tk-field__label">{t('label')}</span>
      <textarea
        className="tk-input min-h-24 py-2"
        maxLength={MAX_TEXT}
        placeholder={t('placeholder')}
        value={props.text}
        onChange={(event) => props.onChange(event.currentTarget.value)}
      />
    </label>
  );
}

/** Smart paste (#193): paste a DM and the empty fields of the form fill themselves. */
export function PasteMessage({ controls }: { readonly controls: DraftControls }) {
  const t = useTranslations('smartPaste');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const parse = useMutation({
    mutationFn: ordersApi.parseText,
    onSuccess: (parsed) => controls.setDraft((draft) => withPastedOrder(draft, parsed)),
  });
  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {t('open')}
      </Button>
    );
  }
  return (
    <section className="flex flex-col gap-2 rounded-panel border border-border bg-surface p-4">
      <MessageBox text={text} onChange={setText} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={text.trim().length < 2 || parse.isPending}
          onClick={() => parse.mutate(text)}
        >
          {parse.isPending ? t('reading') : t('fill')}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {t('close')}
        </Button>
      </div>
      {parse.isError && <p className="text-sm text-stamp">{t('error')}</p>}
      {parse.data && <PasteResult parsed={parse.data} />}
    </section>
  );
}
