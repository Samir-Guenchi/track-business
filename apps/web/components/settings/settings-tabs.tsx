'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '../../i18n/navigation';

const TABS = [
  { key: 'store', href: '/settings/store' },
  { key: 'legal', href: '/settings/legal' },
] as const;

/** The settings sections, as links so each one has its own URL. */
export function SettingsTabs() {
  const t = useTranslations('legal.tabs');
  const pathname = usePathname();
  return (
    <nav aria-label={t('label')} className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              active ? 'border-ink font-medium' : 'border-transparent text-muted'
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
