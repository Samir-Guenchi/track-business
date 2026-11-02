'use client';

import { Button } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { embedSnippet } from '../../lib/forms/form-editor';

/** The one line a seller pastes into a landing page, with a copy button. */
export function EmbedSnippet({ formKey }: { readonly formKey: string }) {
  const t = useTranslations('forms');
  const locale = useLocale();
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const code = embedSnippet(origin, formKey, locale);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{t('snippet')}</span>
      <div className="flex items-start gap-2">
        <code dir="ltr" className="flex-1 break-all rounded-control bg-kraft/40 p-2 text-xs">
          {code}
        </code>
        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          {copied ? t('copied') : t('copy')}
        </Button>
      </div>
    </div>
  );
}
