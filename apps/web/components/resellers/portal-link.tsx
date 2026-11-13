'use client';

import { Button } from '@trackecom/ui';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/** The reseller's secret link, to copy and send them on WhatsApp. */
export function PortalLink({ path }: { readonly path: string }) {
  const t = useTranslations('resellers');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);
  useEffect(() => {
    setUrl(`${window.location.origin}/${locale}${path}`);
  }, [locale, path]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
  };
  return (
    <div className="studio-portal-link">
      <span className="studio-portal-link__label">{t('portal')}</span>
      <code className="studio-portal-link__code" dir="ltr">
        {url}
      </code>
      <span className="studio-portal-link__actions">
        <a className="studio-quiet-link" href={url} target="_blank" rel="noreferrer">
          {t('open')}
          <ExternalLink size={12} aria-hidden />
        </a>
        <Button size="sm" variant="ghost" onClick={copy}>
          {t(copied ? 'copied' : 'copy')}
        </Button>
      </span>
    </div>
  );
}
