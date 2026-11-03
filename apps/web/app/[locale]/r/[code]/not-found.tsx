import { getTranslations } from 'next-intl/server';

export default async function PortalNotFound() {
  const t = await getTranslations('resellerPortal.notFound');
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-muted">{t('body')}</p>
    </div>
  );
}
