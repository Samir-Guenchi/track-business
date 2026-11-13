'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatNumber } from '../../lib/format';
import { useReturnSummary } from '../../lib/returns/returns-queries';

/** One tile per carrier: how many returns it owes, and how many look lost. */
export function ReturnSummary() {
  const t = useTranslations('returns.summary');
  const locale = useLocale() as Locale;
  const summary = useReturnSummary().data;
  if (!summary || summary.carriers.length === 0) return null;
  const count = (value: number) => formatNumber(value, locale);
  return (
    <section aria-label={t('title')} className="flex flex-col gap-2">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.carriers.map((row) => (
          <li
            key={row.carrier}
            className="flex flex-col gap-1 rounded-panel border border-border bg-surface p-3 shadow-panel"
          >
            <span className="text-sm font-semibold" dir="ltr">
              {row.carrier}
            </span>
            <span className="text-sm">{t('expected', { count: count(row.expected) })}</span>
            <span
              className={row.overdue > 0 ? 'text-sm font-medium text-stamp' : 'text-sm text-muted'}
            >
              {t('overdue', { count: count(row.overdue) })}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">{t('hint', { days: summary.overdueDays })}</p>
    </section>
  );
}
