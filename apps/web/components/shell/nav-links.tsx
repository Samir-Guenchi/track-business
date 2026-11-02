'use client';

import { useTranslations } from 'next-intl';
import { navItems } from '../../config/nav';
import { Link, usePathname } from '../../i18n/navigation';

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function NavLinks({ onNavigate }: { readonly onNavigate?: () => void }) {
  const t = useTranslations('shell.nav');
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {navItems.map(({ key, href, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-tape text-paper' : 'text-ink hover:bg-paper dark:hover:bg-surface'
              }`}
            >
              <Icon size={18} aria-hidden />
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
