import { useTranslations } from 'next-intl';
import { BrandMark } from './brand-mark';
import { NavLinks } from './nav-links';

/** Desktop sidebar. It sits on the inline-start side, so it moves to the right in Arabic. */
export function Sidebar() {
  const t = useTranslations('shell');
  return (
    <aside className="hidden w-60 shrink-0 border-e border-border bg-surface lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-5">
        <BrandMark />
      </div>
      <nav aria-label={t('mainNav')} className="flex-1 px-3 py-2">
        <NavLinks />
      </nav>
    </aside>
  );
}
