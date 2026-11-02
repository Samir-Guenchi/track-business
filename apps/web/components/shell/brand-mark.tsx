import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';

export function BrandMark() {
  const t = useTranslations('common');
  return (
    <Link href="/" className="flex items-center gap-2 rounded-control font-semibold text-ink">
      <img src="/brand/trackecom-icon.svg" alt="" width={28} height={28} />
      <span dir="ltr">{t('appName')}</span>
    </Link>
  );
}
