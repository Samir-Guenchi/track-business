'use client';

import { Button } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

/** The reseller's secret link, to copy and send them on WhatsApp. */
export function PortalLink({ path }: { readonly path: string }) {
  const t = useTranslations('resellers');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? path : `${window.location.origin}/${locale}${path}`;
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">{t('portal')}</span>
      <code className="truncate rounded-control bg-canvas px-2 py-1" dir="ltr">
        {url}
      </code>
      <Button size="sm" variant="ghost" onClick={copy}>
        {t(copied ? 'copied' : 'copy')}
      </Button>
    </div>
  );
}
